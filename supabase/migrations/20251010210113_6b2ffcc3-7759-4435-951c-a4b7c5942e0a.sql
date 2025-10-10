-- Drop and recreate the INSERT policy for challenges to ensure it works
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;

CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);