-- Add friend_requests column to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS friend_requests boolean NOT NULL DEFAULT true;

-- Create function to notify friend request recipient
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Only trigger for new pending friend requests
  IF NEW.status = 'pending' THEN
    -- Get sender's name
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Notify the recipient (friend_id)
    PERFORM create_notification(
      NEW.friend_id,
      'New Friend Request',
      v_sender_name || ' sent you a friend request',
      'friendship',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on friendships table
DROP TRIGGER IF EXISTS on_friend_request_insert ON public.friendships;
CREATE TRIGGER on_friend_request_insert
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

-- Update create_notification function to handle friendship type
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
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  IF (p_type = 'habit' AND v_preferences.habit_reminders) OR
     (p_type = 'challenge' AND v_preferences.challenge_updates) OR
     (p_type = 'expense' AND v_preferences.expense_alerts) OR
     (p_type = 'subscription' AND v_preferences.subscription_reminders) OR
     (p_type = 'trip' AND v_preferences.trip_updates) OR
     (p_type = 'friendship' AND v_preferences.friend_requests) THEN
    
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$function$;