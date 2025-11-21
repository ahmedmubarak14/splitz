-- Add task management enhancements to focus_tasks table

-- Create enum for Eisenhower Matrix quadrants
CREATE TYPE priority_quadrant AS ENUM (
  'urgent_important',
  'not_urgent_important', 
  'urgent_unimportant',
  'not_urgent_unimportant'
);

-- Add new columns to focus_tasks
ALTER TABLE focus_tasks
ADD COLUMN IF NOT EXISTS priority_quadrant priority_quadrant,
ADD COLUMN IF NOT EXISTS project text DEFAULT 'Inbox',
ADD COLUMN IF NOT EXISTS icon text DEFAULT '📋',
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_spent integer DEFAULT 0;

-- Update focus_sessions to track duration properly
-- Add trigger to update total_time_spent on task when session completes
CREATE OR REPLACE FUNCTION update_task_time_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.task_id IS NOT NULL THEN
    UPDATE focus_tasks
    SET total_time_spent = COALESCE(total_time_spent, 0) + NEW.duration_minutes
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_task_time_spent
AFTER UPDATE OF end_time ON focus_sessions
FOR EACH ROW
WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
EXECUTE FUNCTION update_task_time_spent();