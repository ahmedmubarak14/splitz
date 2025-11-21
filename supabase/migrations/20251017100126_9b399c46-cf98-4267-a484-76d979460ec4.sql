-- Drop the overly permissive policy that allows everyone to see all profiles
DROP POLICY IF EXISTS "Users can search other profiles" ON public.profiles;

-- Drop the redundant duplicate policy
DROP POLICY IF EXISTS "Users can view profiles of friends and pending requests" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a single comprehensive SELECT policy for profiles
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = id 
  OR
  -- Any profile for searching (needed for username search in AddFriendDialog)
  true
);