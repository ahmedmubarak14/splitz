-- Fix function search_path security warnings
-- Set search_path for public schema functions

CREATE OR REPLACE FUNCTION public.update_login_streak()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;