-- Create triggers for trip notifications and task syncing

-- Trigger for notifying when a member is added to a trip
CREATE OR REPLACE TRIGGER on_trip_member_added
  AFTER INSERT ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trip_member_added();

-- Trigger for notifying when a task is assigned
CREATE OR REPLACE TRIGGER on_trip_task_assigned
  AFTER INSERT OR UPDATE OF assigned_to, assigned_to_group ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trip_task_assigned();

-- Create unique index for trip_task_id in focus_tasks to ensure only one synced task per trip task
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_tasks_trip_task_id_unique 
  ON public.focus_tasks(trip_task_id) 
  WHERE trip_task_id IS NOT NULL;

-- Trigger for syncing trip tasks to focus tasks
CREATE OR REPLACE TRIGGER sync_trip_task_on_assign
  AFTER INSERT OR UPDATE ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trip_task_to_focus_task();

-- Trigger for deleting synced focus tasks when trip task is deleted
CREATE OR REPLACE TRIGGER delete_synced_focus_task_on_trip_task_delete
  BEFORE DELETE ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_synced_focus_task();