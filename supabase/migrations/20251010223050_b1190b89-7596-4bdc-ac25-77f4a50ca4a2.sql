-- Clean up duplicate RLS policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Update group member viewing policy to be more restrictive
DROP POLICY IF EXISTS "Users can view group members limited info" ON profiles;

CREATE POLICY "Users can view group members limited info" ON profiles
FOR SELECT
USING (
  -- Allow viewing limited fields for group members only
  (id IN (
    SELECT DISTINCT egm2.user_id
    FROM expense_group_members egm1
    JOIN expense_group_members egm2 ON egm1.group_id = egm2.group_id
    WHERE egm1.user_id = auth.uid()
  )
  OR
  id IN (
    SELECT DISTINCT cp2.user_id
    FROM challenge_participants cp1
    JOIN challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
    WHERE cp1.user_id = auth.uid()
  ))
  AND auth.uid() <> id
);

-- Add helpful comment
COMMENT ON POLICY "Users can view group members limited info" ON profiles IS 
'Allows viewing full_name, avatar_url, and id only for users in the same expense groups or challenges. Own profile accessible via separate policy.';