-- Fix trip task update failure by correcting enum usage in trigger
-- The focus_tasks.priority_quadrant column is enum priority_quadrant with underscore labels
-- Replace sync_trip_task_to_focus_task to cast properly and use underscore enum labels

CREATE OR REPLACE FUNCTION public.sync_trip_task_to_focus_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        WHEN NEW.priority = 'high' THEN 'urgent_important'::priority_quadrant
        WHEN NEW.priority = 'medium' THEN 'not_urgent_important'::priority_quadrant
        ELSE 'not_urgent_unimportant'::priority_quadrant
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