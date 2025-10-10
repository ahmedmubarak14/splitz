-- Server-side enforcement: set creator_id to the authenticated user on insert
CREATE OR REPLACE FUNCTION public.set_challenge_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;
  -- Prevent spoofing: always set creator_id from the JWT
  NEW.creator_id := auth.uid();
  RETURN NEW;
END;
$$;

-- Attach trigger to challenges table
DROP TRIGGER IF EXISTS trg_set_challenge_creator ON public.challenges;
CREATE TRIGGER trg_set_challenge_creator
BEFORE INSERT ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.set_challenge_creator();

-- Ensure the INSERT policy exists and is correct (idempotent)
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);