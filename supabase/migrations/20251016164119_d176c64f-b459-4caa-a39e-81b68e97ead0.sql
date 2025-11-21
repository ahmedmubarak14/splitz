-- Add streak freeze columns to habits table
ALTER TABLE habits 
  ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS last_freeze_used_at TIMESTAMP WITH TIME ZONE;

-- Create streak_freeze_history table for tracking
CREATE TABLE IF NOT EXISTS streak_freeze_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_saved INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE streak_freeze_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streak_freeze_history
CREATE POLICY "Users can view their freeze history"
ON streak_freeze_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their freeze history"
ON streak_freeze_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update the streak calculation function to support freezes
CREATE OR REPLACE FUNCTION public.update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak INTEGER;
  last_checkin_date DATE;
  yesterday DATE;
  has_freeze BOOLEAN;
  days_missed INTEGER;
BEGIN
  -- Get last check-in date
  SELECT DATE(checked_in_at) INTO last_checkin_date
  FROM habit_check_ins
  WHERE habit_id = NEW.habit_id 
    AND user_id = NEW.user_id
    AND DATE(checked_in_at) < DATE(NEW.checked_in_at)
  ORDER BY checked_in_at DESC
  LIMIT 1;

  yesterday := DATE(NEW.checked_in_at) - INTERVAL '1 day';
  
  -- Get current streak and check freeze availability
  SELECT 
    COALESCE(streak_count, 0),
    COALESCE(streak_freezes_available, 0) > 0
  INTO current_streak, has_freeze
  FROM habits 
  WHERE id = NEW.habit_id;

  -- Calculate streak with freeze protection
  IF last_checkin_date IS NULL THEN
    -- First check-in
    current_streak := 1;
  ELSIF DATE(last_checkin_date) = yesterday THEN
    -- Consecutive day
    current_streak := current_streak + 1;
  ELSIF DATE(last_checkin_date) = yesterday - INTERVAL '1 day' AND has_freeze THEN
    -- One day missed but freeze available - use it!
    current_streak := current_streak + 1;
    
    -- Use one freeze
    UPDATE habits 
    SET 
      streak_freezes_available = streak_freezes_available - 1,
      last_freeze_used_at = NOW()
    WHERE id = NEW.habit_id;
    
    -- Log freeze usage
    INSERT INTO streak_freeze_history (habit_id, user_id, streak_saved)
    VALUES (NEW.habit_id, NEW.user_id, current_streak);
    
    -- Notify user about freeze usage
    PERFORM create_notification(
      NEW.user_id,
      'Streak Freeze Used',
      'Your streak was saved! You have ' || (SELECT streak_freezes_available FROM habits WHERE id = NEW.habit_id) || ' freezes remaining.',
      'habit',
      NEW.habit_id
    );
  ELSE
    -- Not consecutive and no freeze available - reset
    current_streak := 1;
  END IF;

  -- Award freeze every 7 days
  IF current_streak > 0 AND current_streak % 7 = 0 THEN
    UPDATE habits 
    SET streak_freezes_available = COALESCE(streak_freezes_available, 0) + 1
    WHERE id = NEW.habit_id;
    
    -- Notify user about earned freeze
    PERFORM create_notification(
      NEW.user_id,
      '🎉 Freeze Earned!',
      'You earned a Streak Freeze for reaching ' || current_streak || ' days!',
      'habit',
      NEW.habit_id
    );
  END IF;

  -- Update habit
  UPDATE habits
  SET 
    streak_count = current_streak,
    best_streak = GREATEST(COALESCE(best_streak, 0), current_streak),
    last_completed_at = NEW.checked_in_at
  WHERE id = NEW.habit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;