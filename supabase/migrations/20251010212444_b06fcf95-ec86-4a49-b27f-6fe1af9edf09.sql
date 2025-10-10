-- Fix challenges insert RLS failure by restoring trigger and aligning policies
-- 1) Ensure BEFORE INSERT trigger sets creator_id from auth context
DROP TRIGGER IF EXISTS trg_set_challenge_creator ON public.challenges;
CREATE TRIGGER trg_set_challenge_creator
BEFORE INSERT ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.set_challenge_creator();

-- 2) Recreate RLS policies for challenges with consistent 'authenticated' role
-- Drop existing policies if present
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can delete their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can view challenges they created or participate in" ON public.challenges;

-- Create clear, non-recursive policies
CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own challenges"
ON public.challenges
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Users can update their own challenges"
ON public.challenges
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view challenges they created or participate in"
ON public.challenges
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = public.challenges.id
      AND cp.user_id = auth.uid()
  )
);
