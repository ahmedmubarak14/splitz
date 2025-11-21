-- Create function to auto-add trip creator as member
CREATE OR REPLACE FUNCTION public.add_trip_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add the trip creator as a creator member
  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'creator')
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on trips table to auto-add creator
DROP TRIGGER IF EXISTS auto_add_trip_creator ON public.trips;
CREATE TRIGGER auto_add_trip_creator
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION add_trip_creator_as_member();

-- Fix existing trips - add creators as members if not already present
INSERT INTO public.trip_members (trip_id, user_id, role)
SELECT t.id, t.created_by, 'creator'
FROM public.trips t
LEFT JOIN public.trip_members tm ON tm.trip_id = t.id AND tm.user_id = t.created_by
WHERE tm.id IS NULL;