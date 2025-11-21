-- Fix Security Definer View issue
-- The public_profiles view uses SECURITY DEFINER by default, which bypasses RLS
-- We already have secure functions (get_public_profile, get_public_profiles) that handle this properly
-- Drop the view as it's redundant and poses a security risk

DROP VIEW IF EXISTS public.public_profiles;

-- The following secure functions are already in place and should be used instead:
-- - get_own_profile() - for getting current user's full profile (including email)
-- - get_public_profile(user_id) - for getting another user's public profile (no email)
-- - get_public_profiles(user_ids[]) - for batch getting public profiles (no email)

COMMENT ON FUNCTION public.get_public_profile IS 
'Securely retrieves a public profile by user ID without exposing email addresses. Use this instead of direct profile queries.';

COMMENT ON FUNCTION public.get_public_profiles IS 
'Batch retrieves multiple public profiles without exposing email addresses. Use this for displaying lists of users instead of direct profile queries.';