-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'habit', 'challenge', 'expense'
  resource_id UUID, -- ID of the related resource
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  habit_reminders BOOLEAN NOT NULL DEFAULT true,
  challenge_updates BOOLEAN NOT NULL DEFAULT true,
  expense_alerts BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_resource_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
     (p_type = 'expense' AND v_preferences.expense_alerts) THEN
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for new challenge participants
CREATE OR REPLACE FUNCTION public.notify_challenge_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_challenge_name TEXT;
  v_creator_id UUID;
  v_participant_name TEXT;
BEGIN
  -- Get challenge details
  SELECT name, creator_id INTO v_challenge_name, v_creator_id
  FROM challenges
  WHERE id = NEW.challenge_id;

  -- Get participant name
  SELECT full_name INTO v_participant_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Notify challenge creator
  IF v_creator_id != NEW.user_id THEN
    PERFORM create_notification(
      v_creator_id,
      'New Participant',
      v_participant_name || ' joined "' || v_challenge_name || '"',
      'challenge',
      NEW.challenge_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_challenge_join
AFTER INSERT ON challenge_participants
FOR EACH ROW
EXECUTE FUNCTION notify_challenge_join();

-- Create trigger for challenge progress milestones
CREATE OR REPLACE FUNCTION public.notify_challenge_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_challenge_name TEXT;
  v_creator_id UUID;
  v_participants UUID[];
BEGIN
  -- Only trigger on significant progress changes
  IF (OLD.progress < 25 AND NEW.progress >= 25) OR
     (OLD.progress < 50 AND NEW.progress >= 50) OR
     (OLD.progress < 75 AND NEW.progress >= 75) OR
     (OLD.progress < 100 AND NEW.progress >= 100) THEN
    
    -- Get challenge details
    SELECT name, creator_id INTO v_challenge_name, v_creator_id
    FROM challenges
    WHERE id = NEW.challenge_id;

    -- Get all participants
    SELECT array_agg(user_id) INTO v_participants
    FROM challenge_participants
    WHERE challenge_id = NEW.challenge_id AND user_id != NEW.user_id;

    -- Notify all other participants
    IF v_participants IS NOT NULL THEN
      PERFORM create_notification(
        unnest(v_participants),
        'Challenge Progress',
        'Someone reached ' || NEW.progress || '% in "' || v_challenge_name || '"',
        'challenge',
        NEW.challenge_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_challenge_milestone
AFTER UPDATE ON challenge_participants
FOR EACH ROW
WHEN (OLD.progress IS DISTINCT FROM NEW.progress)
EXECUTE FUNCTION notify_challenge_milestone();

-- Create trigger for new expenses
CREATE OR REPLACE FUNCTION public.notify_new_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_group_name TEXT;
  v_members UUID[];
  v_payer_name TEXT;
BEGIN
  -- Get group name
  SELECT name INTO v_group_name
  FROM expense_groups
  WHERE id = NEW.group_id;

  -- Get payer name
  SELECT full_name INTO v_payer_name
  FROM profiles
  WHERE id = NEW.paid_by;

  -- Get all group members except the creator
  SELECT array_agg(user_id) INTO v_members
  FROM expense_group_members
  WHERE group_id = NEW.group_id AND user_id != NEW.user_id;

  -- Notify all members
  IF v_members IS NOT NULL THEN
    PERFORM create_notification(
      unnest(v_members),
      'New Expense',
      v_payer_name || ' added "' || NEW.name || '" (SAR ' || NEW.total_amount || ') in ' || v_group_name,
      'expense',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_expense
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION notify_new_expense();

-- Add trigger for updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);