-- Phase 1: Add trip notifications preference
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS trip_updates BOOLEAN DEFAULT TRUE;

-- Phase 1: Update create_notification function to handle trip type
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
     (p_type = 'subscription' AND v_preferences.subscription_reminders) OR
     (p_type = 'trip' AND v_preferences.trip_updates) THEN
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$function$;

-- Phase 1: Create trigger function for trip member added
CREATE OR REPLACE FUNCTION public.notify_trip_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip_name TEXT;
  v_inviter_name TEXT;
  v_creator_id UUID;
BEGIN
  -- Get trip name and creator
  SELECT name, created_by INTO v_trip_name, v_creator_id
  FROM trips
  WHERE id = NEW.trip_id;

  -- Get inviter name (trip creator)
  SELECT full_name INTO v_inviter_name
  FROM profiles
  WHERE id = v_creator_id;

  -- Only notify if not the creator adding themselves
  IF NEW.user_id != v_creator_id THEN
    -- Notify new member
    PERFORM create_notification(
      NEW.user_id,
      'Added to Trip',
      v_inviter_name || ' added you to "' || v_trip_name || '"',
      'trip',
      NEW.trip_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Phase 1: Create trigger for trip member added
DROP TRIGGER IF EXISTS on_trip_member_added ON trip_members;
CREATE TRIGGER on_trip_member_added
  AFTER INSERT ON trip_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_member_added();

-- Phase 1: Create trigger function for trip task assigned
CREATE OR REPLACE FUNCTION public.notify_trip_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip_name TEXT;
  v_assigner_name TEXT;
BEGIN
  -- Get trip name
  SELECT name INTO v_trip_name
  FROM trips
  WHERE id = NEW.trip_id;

  -- Get assigner name
  SELECT full_name INTO v_assigner_name
  FROM profiles
  WHERE id = NEW.created_by;

  -- Only notify if assigned_to changed and is not null
  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    -- Notify assigned user (don't notify if they assigned it to themselves)
    IF NEW.assigned_to != NEW.created_by THEN
      PERFORM create_notification(
        NEW.assigned_to,
        'Task Assigned',
        v_assigner_name || ' assigned you "' || NEW.title || '" in ' || v_trip_name,
        'trip',
        NEW.trip_id
      );
    END IF;
  END IF;

  -- If assigned to group, notify all members except creator
  IF NEW.assigned_to_group = true AND (TG_OP = 'INSERT' OR (OLD.assigned_to_group IS DISTINCT FROM NEW.assigned_to_group)) THEN
    -- Notify all trip members except creator
    PERFORM create_notification(
      tm.user_id,
      'New Group Task',
      'New task "' || NEW.title || '" assigned to everyone in ' || v_trip_name,
      'trip',
      NEW.trip_id
    )
    FROM trip_members tm
    WHERE tm.trip_id = NEW.trip_id
      AND tm.user_id != NEW.created_by;
  END IF;

  RETURN NEW;
END;
$function$;

-- Phase 1: Create trigger for trip task assigned
DROP TRIGGER IF EXISTS on_trip_task_assigned ON trip_tasks;
CREATE TRIGGER on_trip_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to, assigned_to_group ON trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_task_assigned();

-- Phase 4: Link trip_tasks to focus_tasks
ALTER TABLE public.focus_tasks
ADD COLUMN IF NOT EXISTS trip_task_id UUID REFERENCES public.trip_tasks(id) ON DELETE CASCADE;

-- Phase 4: Add unique constraint to prevent duplicate syncs
CREATE UNIQUE INDEX IF NOT EXISTS focus_tasks_trip_task_id_key ON public.focus_tasks(trip_task_id) WHERE trip_task_id IS NOT NULL;

-- Phase 4: Create trigger function to sync trip tasks to focus_tasks
CREATE OR REPLACE FUNCTION public.sync_trip_task_to_focus_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip_name TEXT;
BEGIN
  -- Only sync if assigned to a specific user
  IF NEW.assigned_to IS NOT NULL THEN
    -- Get trip name for project
    SELECT name INTO v_trip_name
    FROM trips
    WHERE id = NEW.trip_id;

    -- Insert or update focus task
    INSERT INTO focus_tasks (
      user_id,
      title,
      description,
      due_date,
      trip_task_id,
      project,
      is_completed,
      priority_quadrant
    ) VALUES (
      NEW.assigned_to,
      NEW.title,
      NEW.description,
      NEW.due_date,
      NEW.id,
      'Trip: ' || v_trip_name,
      (NEW.status = 'done'),
      CASE 
        WHEN NEW.priority = 'high' THEN 'urgent-important'
        WHEN NEW.priority = 'medium' THEN 'not-urgent-important'
        ELSE 'not-urgent-not-important'
      END
    )
    ON CONFLICT (trip_task_id) 
    WHERE trip_task_id IS NOT NULL
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      due_date = EXCLUDED.due_date,
      is_completed = EXCLUDED.is_completed,
      priority_quadrant = EXCLUDED.priority_quadrant,
      updated_at = now();
  END IF;
  
  -- If assigned_to was removed, delete the synced task
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
    DELETE FROM focus_tasks WHERE trip_task_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 4: Create trigger to sync trip tasks
DROP TRIGGER IF EXISTS sync_trip_task_on_assign ON trip_tasks;
CREATE TRIGGER sync_trip_task_on_assign
  AFTER INSERT OR UPDATE ON trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_trip_task_to_focus_task();

-- Phase 4: Create trigger to delete synced tasks when trip task is deleted
CREATE OR REPLACE FUNCTION public.delete_synced_focus_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM focus_tasks WHERE trip_task_id = OLD.id;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS delete_synced_task_on_trip_task_delete ON trip_tasks;
CREATE TRIGGER delete_synced_task_on_trip_task_delete
  BEFORE DELETE ON trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_synced_focus_task();