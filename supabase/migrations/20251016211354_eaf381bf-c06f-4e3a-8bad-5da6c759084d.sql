-- Add subscription_reminders column to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS subscription_reminders BOOLEAN DEFAULT TRUE;

-- Update create_notification function to handle subscription type
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_message text, p_type text, p_resource_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  -- Check user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences, create default
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  -- Check if this type of notification is enabled
  IF (p_type = 'habit' AND v_preferences.habit_reminders) OR
     (p_type = 'challenge' AND v_preferences.challenge_updates) OR
     (p_type = 'expense' AND v_preferences.expense_alerts) OR
     (p_type = 'subscription' AND v_preferences.subscription_reminders) THEN
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$function$;