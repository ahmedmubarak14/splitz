-- Fix RLS policy for trip_tasks to allow all trip members to update
DROP POLICY IF EXISTS "Assigned users and creators can update tasks" ON public.trip_tasks;

CREATE POLICY "Trip members can update tasks"
  ON public.trip_tasks FOR UPDATE
  USING (is_trip_member(auth.uid(), trip_id));

-- Add trip_id column to expense_groups to link expenses to trips
ALTER TABLE public.expense_groups
ADD COLUMN trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_expense_groups_trip ON public.expense_groups(trip_id);

-- Update RLS policies to allow trip members to view/manage trip expenses
CREATE POLICY "Trip members can view trip expense groups"
  ON public.expense_groups FOR SELECT
  USING (
    (trip_id IS NULL AND is_group_member(auth.uid(), id)) OR 
    (trip_id IS NOT NULL AND is_trip_member(auth.uid(), trip_id))
  );

DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.expense_groups;

CREATE POLICY "Trip members can create trip expense groups"
  ON public.expense_groups FOR INSERT
  WITH CHECK (
    (trip_id IS NULL AND auth.uid() = created_by) OR
    (trip_id IS NOT NULL AND is_trip_member(auth.uid(), trip_id))
  );

CREATE POLICY "Trip members can update trip expense groups"
  ON public.expense_groups FOR UPDATE
  USING (
    (trip_id IS NULL AND auth.uid() = created_by) OR 
    (trip_id IS NOT NULL AND is_trip_member(auth.uid(), trip_id))
  );

CREATE POLICY "Trip members can delete trip expense groups"
  ON public.expense_groups FOR DELETE
  USING (
    (trip_id IS NULL AND auth.uid() = created_by) OR
    (trip_id IS NOT NULL AND is_trip_member(auth.uid(), trip_id))
  );

-- Create function to auto-add trip creator as member
CREATE OR REPLACE FUNCTION public.auto_add_trip_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the trip creator as a member
  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'creator')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-add creator when trip is created
DROP TRIGGER IF EXISTS auto_add_trip_creator_trigger ON public.trips;
CREATE TRIGGER auto_add_trip_creator_trigger
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_trip_creator();

-- Add role column to trip_members if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'trip_members' AND column_name = 'role') THEN
    ALTER TABLE public.trip_members 
    ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member'));
  END IF;
END $$;