-- Update create_notification function to send email notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_resource_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  -- Check if this notification type is enabled
  IF (p_type = 'habit' AND v_preferences.habit_reminders) OR
     (p_type = 'challenge' AND v_preferences.challenge_updates) OR
     (p_type = 'expense' AND v_preferences.expense_alerts) OR
     (p_type = 'subscription' AND v_preferences.subscription_reminders) OR
     (p_type = 'trip' AND v_preferences.trip_updates) OR
     (p_type = 'friendship' AND v_preferences.friend_requests) THEN
    
    -- Create in-app notification
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    -- Send email notification if enabled (async, non-blocking)
    IF v_preferences.email_notifications THEN
      -- Get Supabase URL and service role key from vault
      v_supabase_url := current_setting('supabase.url', true);
      v_service_role_key := current_setting('supabase.service_role_key', true);
      
      -- Make async HTTP call to send email (fire and forget)
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/send-notification-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
          ),
          body := jsonb_build_object(
            'userId', p_user_id,
            'title', p_title,
            'message', p_message,
            'type', p_type,
            'resourceId', p_resource_id
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Silently fail email sending, don't block notification creation
        RAISE WARNING 'Failed to trigger email notification: %', SQLERRM;
      END;
    END IF;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Enable pg_net extension for async HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;