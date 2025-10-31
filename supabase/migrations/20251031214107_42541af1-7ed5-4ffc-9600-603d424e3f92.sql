-- Add streak tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS best_login_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_freezes_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_freeze_reset_date date DEFAULT CURRENT_DATE;

-- Create function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset streak freezes monthly
  IF NEW.last_freeze_reset_date < date_trunc('month', CURRENT_DATE) THEN
    NEW.streak_freezes_used = 0;
    NEW.last_freeze_reset_date = CURRENT_DATE;
  END IF;

  -- Check if user logged in today already
  IF NEW.last_login_date = CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  -- Check if streak continues (logged in yesterday or today)
  IF NEW.last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continue streak
    NEW.login_streak = NEW.login_streak + 1;
    NEW.last_login_date = CURRENT_DATE;
    
    -- Update best streak
    IF NEW.login_streak > NEW.best_login_streak THEN
      NEW.best_login_streak = NEW.login_streak;
    END IF;
  ELSIF NEW.last_login_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken - check if freeze available
    IF NEW.streak_freezes_used < 2 THEN
      -- Use freeze to save streak
      NEW.streak_freezes_used = NEW.streak_freezes_used + 1;
      NEW.last_login_date = CURRENT_DATE;
      
      -- Log the freeze usage
      INSERT INTO streak_freeze_history (user_id, habit_id, streak_saved, used_at)
      VALUES (NEW.id, NULL, NEW.login_streak, NOW());
    ELSE
      -- No freezes available, reset streak
      NEW.login_streak = 1;
      NEW.last_login_date = CURRENT_DATE;
    END IF;
  ELSE
    -- First login or same day
    NEW.login_streak = 1;
    NEW.last_login_date = CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for login streak
DROP TRIGGER IF EXISTS trigger_update_login_streak ON profiles;
CREATE TRIGGER trigger_update_login_streak
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_login_streak();

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  category text NOT NULL, -- 'habit', 'focus', 'social', 'challenge', 'streak'
  requirement jsonb NOT NULL, -- {type: 'habit_count', value: 10}
  xp_reward integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add XP and level to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

-- Insert initial achievements
INSERT INTO achievements (code, name, description, icon, category, requirement, xp_reward) VALUES
('first_habit', 'First Steps', 'Create your first habit', '🌱', 'habit', '{"type": "habit_count", "value": 1}', 50),
('habit_master', 'Habit Master', 'Create 10 habits', '⭐', 'habit', '{"type": "habit_count", "value": 10}', 200),
('week_warrior', 'Week Warrior', 'Maintain a 7-day login streak', '🔥', 'streak', '{"type": "login_streak", "value": 7}', 150),
('month_champion', 'Month Champion', 'Maintain a 30-day login streak', '👑', 'streak', '{"type": "login_streak", "value": 30}', 500),
('focus_beginner', 'Focus Beginner', 'Complete your first Pomodoro', '🍅', 'focus', '{"type": "focus_sessions", "value": 1}', 50),
('focus_pro', 'Focus Pro', 'Complete 50 Pomodoros', '🎯', 'focus', '{"type": "focus_sessions", "value": 50}', 300),
('social_butterfly', 'Social Butterfly', 'Add 5 friends', '🦋', 'social', '{"type": "friend_count", "value": 5}', 100),
('challenge_starter', 'Challenge Starter', 'Create your first challenge', '🚀', 'challenge', '{"type": "challenges_created", "value": 1}', 75),
('challenge_winner', 'Challenge Winner', 'Win a challenge', '🏆', 'challenge', '{"type": "challenges_won", "value": 1}', 200),
('early_bird', 'Early Bird', 'Complete a habit before 8 AM', '🌅', 'habit', '{"type": "early_checkin", "value": 1}', 75);

-- Function to award XP
CREATE OR REPLACE FUNCTION award_xp(p_user_id uuid, p_amount integer)
RETURNS void AS $$
DECLARE
  v_current_xp integer;
  v_current_level integer;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate new XP
  v_new_xp = v_current_xp + p_amount;
  
  -- Calculate new level (100 XP per level, exponential)
  v_new_level = FLOOR(SQRT(v_new_xp / 100)) + 1;
  
  -- Update profile
  UPDATE profiles 
  SET xp = v_new_xp, level = v_new_level
  WHERE id = p_user_id;
  
  -- Create notification if leveled up
  IF v_new_level > v_current_level THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      p_user_id,
      'level_up',
      'Level Up! 🎉',
      'You reached level ' || v_new_level || '! Keep going!'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL, -- 'ios' or 'android'
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);