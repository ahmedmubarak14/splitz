-- Add status column to trips table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'trips' AND column_name = 'status') THEN
    ALTER TABLE public.trips 
    ADD COLUMN status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled'));
  END IF;
END $$;

-- Create function to auto-update trip status based on dates
CREATE OR REPLACE FUNCTION public.update_trip_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If start date is today or in the past and end date is in the future, set to active
  IF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    NEW.status := 'active';
  -- If end date is in the past, set to completed
  ELSIF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'completed';
  -- Otherwise keep as planning
  ELSIF NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'planning';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update trip status
DROP TRIGGER IF EXISTS update_trip_status_trigger ON public.trips;
CREATE TRIGGER update_trip_status_trigger
  BEFORE INSERT OR UPDATE OF start_date, end_date ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_status();

-- Update existing trips to set proper status
UPDATE public.trips
SET status = CASE
  WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 'active'
  WHEN end_date < CURRENT_DATE THEN 'completed'
  ELSE 'planning'
END
WHERE status IS NULL OR status = 'planning';