-- Delete duplicate check-ins, keeping only the latest one per day
DELETE FROM habit_check_ins
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY habit_id, user_id, DATE(checked_in_at) 
             ORDER BY checked_in_at DESC
           ) as rn
    FROM habit_check_ins
  ) t
  WHERE rn > 1
);

-- Function to extract date from timestamp for unique constraint
CREATE OR REPLACE FUNCTION habit_checkin_date(checked_in_at timestamp with time zone)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT DATE(checked_in_at);
$$;

-- Add unique index to prevent multiple check-ins per day
DROP INDEX IF EXISTS habit_check_ins_unique_daily_idx;
CREATE UNIQUE INDEX habit_check_ins_unique_daily_idx 
  ON habit_check_ins (habit_id, user_id, habit_checkin_date(checked_in_at));

-- Function to update habit streak
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak integer;
  last_checkin_date date;
  yesterday date;
BEGIN
  -- Get the last check-in date for this habit (excluding today's)
  SELECT DATE(checked_in_at) INTO last_checkin_date
  FROM habit_check_ins
  WHERE habit_id = NEW.habit_id 
    AND user_id = NEW.user_id
    AND DATE(checked_in_at) < DATE(NEW.checked_in_at)
  ORDER BY checked_in_at DESC
  LIMIT 1;

  -- Calculate yesterday's date
  yesterday := DATE(NEW.checked_in_at) - INTERVAL '1 day';

  -- Get current streak from habits table
  SELECT COALESCE(streak_count, 0) INTO current_streak
  FROM habits
  WHERE id = NEW.habit_id;

  -- Update streak: increment if consecutive, reset to 1 if not
  IF last_checkin_date IS NULL OR DATE(last_checkin_date) = yesterday THEN
    -- Consecutive day or first check-in
    current_streak := current_streak + 1;
  ELSE
    -- Not consecutive, reset to 1
    current_streak := 1;
  END IF;

  -- Update the habit with new streak and update best_streak if needed
  UPDATE habits
  SET 
    streak_count = current_streak,
    best_streak = GREATEST(COALESCE(best_streak, 0), current_streak),
    last_completed_at = NEW.checked_in_at
  WHERE id = NEW.habit_id;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_habit_streak ON habit_check_ins;
CREATE TRIGGER trigger_update_habit_streak
  AFTER INSERT ON habit_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();

-- Create invitations table for sharing challenges and expense groups
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code text NOT NULL UNIQUE,
  invite_type text NOT NULL CHECK (invite_type IN ('challenge', 'expense')),
  resource_id uuid NOT NULL,
  created_by uuid NOT NULL,
  expires_at timestamp with time zone,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
DROP POLICY IF EXISTS "Users can view invitations they created" ON public.invitations;
CREATE POLICY "Users can view invitations they created"
ON public.invitations
FOR SELECT
USING (auth.uid() = created_by OR true);

DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
CREATE POLICY "Users can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their invitations" ON public.invitations;
CREATE POLICY "Users can update their invitations"
ON public.invitations
FOR UPDATE
USING (auth.uid() = created_by);