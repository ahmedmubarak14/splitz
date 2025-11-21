-- Fix notification functions to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_message text, p_type text, p_resource_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
     (p_type = 'trip' AND v_preferences.trip_updates) THEN
    
    INSERT INTO notifications (user_id, title, message, type, resource_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_resource_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_trip_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_name TEXT;
  v_inviter_name TEXT;
  v_creator_id UUID;
BEGIN
  SELECT name, created_by INTO v_trip_name, v_creator_id
  FROM trips
  WHERE id = NEW.trip_id;

  SELECT full_name INTO v_inviter_name
  FROM profiles
  WHERE id = v_creator_id;

  IF NEW.user_id != v_creator_id THEN
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
$$;

CREATE OR REPLACE FUNCTION public.notify_trip_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_name TEXT;
  v_assigner_name TEXT;
BEGIN
  SELECT name INTO v_trip_name
  FROM trips
  WHERE id = NEW.trip_id;

  SELECT full_name INTO v_assigner_name
  FROM profiles
  WHERE id = NEW.created_by;

  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
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

  IF NEW.assigned_to_group = true AND (TG_OP = 'INSERT' OR (OLD.assigned_to_group IS DISTINCT FROM NEW.assigned_to_group)) THEN
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
$$;

-- Create sync function for trip tasks to focus tasks
CREATE OR REPLACE FUNCTION public.sync_trip_task_to_focus_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_name TEXT;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT name INTO v_trip_name
    FROM trips
    WHERE id = NEW.trip_id;

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
      user_id = EXCLUDED.user_id,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      due_date = EXCLUDED.due_date,
      is_completed = EXCLUDED.is_completed,
      priority_quadrant = EXCLUDED.priority_quadrant,
      updated_at = now();
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
    DELETE FROM focus_tasks WHERE trip_task_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_synced_focus_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM focus_tasks WHERE trip_task_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Create unique index for trip_task_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_tasks_trip_task_id_unique 
ON public.focus_tasks(trip_task_id) 
WHERE trip_task_id IS NOT NULL;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_trip_member_added ON public.trip_members;
DROP TRIGGER IF EXISTS on_trip_task_assigned ON public.trip_tasks;
DROP TRIGGER IF EXISTS sync_trip_task_on_assign ON public.trip_tasks;
DROP TRIGGER IF EXISTS delete_synced_focus_task_on_trip_task_delete ON public.trip_tasks;

-- Create triggers
CREATE TRIGGER on_trip_member_added
  AFTER INSERT ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trip_member_added();

CREATE TRIGGER on_trip_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to, assigned_to_group ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trip_task_assigned();

CREATE TRIGGER sync_trip_task_on_assign
  AFTER INSERT OR UPDATE OF assigned_to, status, title, description, due_date, priority ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trip_task_to_focus_task();

CREATE TRIGGER delete_synced_focus_task_on_trip_task_delete
  BEFORE DELETE ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_synced_focus_task();