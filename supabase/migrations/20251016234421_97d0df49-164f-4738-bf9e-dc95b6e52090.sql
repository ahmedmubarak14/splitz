-- Fix profiles table RLS to prevent email exposure
-- Drop all policies that expose profiles to other users
DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view group members limited info" ON public.profiles;
DROP POLICY IF EXISTS "Subscription owners can view contributor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Co-contributors can view shared profiles" ON public.profiles;

-- Keep only the policy that allows users to view their own full profile
-- (Users can view own profile policy already exists)

-- Ensure users can still insert and update their own profiles
-- (These policies already exist, just ensuring they're correct)

-- Now all other user profile viewing MUST go through:
-- 1. public_profiles view (excludes email)
-- 2. get_public_profile(_user_id) function
-- 3. get_public_profiles(_user_ids[]) function
-- 4. get_own_profile() function (for current user's full data)

-- Grant SELECT on public_profiles view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;