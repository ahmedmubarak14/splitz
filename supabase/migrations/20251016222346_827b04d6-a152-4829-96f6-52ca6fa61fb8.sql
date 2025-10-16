-- Fix trip task sync to Tasks manager and RLS policies

-- Add permissive RLS policies for focus_tasks to allow syncing from trip_tasks
CREATE POLICY "Allow sync from trip tasks - insert"
ON public.focus_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  trip_task_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.trip_tasks t 
    WHERE t.id = trip_task_id 
    AND is_trip_member(auth.uid(), t.trip_id)
  )
);

CREATE POLICY "Allow sync from trip tasks - update"
ON public.focus_tasks
FOR UPDATE
TO authenticated
USING (
  trip_task_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.trip_tasks t 
    WHERE t.id = trip_task_id 
    AND is_trip_member(auth.uid(), t.trip_id)
  )
);