-- Create public_profiles view without sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  preferred_language,
  onboarding_completed,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create secure function to get user profile with email (only for self)
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  email TEXT,
  preferred_language TEXT,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    username,
    avatar_url,
    email,
    preferred_language,
    onboarding_completed,
    created_at,
    updated_at
  FROM public.profiles
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- Create function to get public profile by ID (no email)
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  preferred_language TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    username,
    avatar_url,
    preferred_language
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;

-- Create function to get multiple public profiles (batch lookup)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids UUID[])
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  preferred_language TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    username,
    avatar_url,
    preferred_language
  FROM public.profiles
  WHERE id = ANY(_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO authenticated;

COMMENT ON VIEW public.public_profiles IS 
'Public view of user profiles without sensitive data like email addresses. Use this for displaying other users information.';

COMMENT ON FUNCTION public.get_own_profile IS 
'Securely retrieves the current users own profile including email. Only returns data for auth.uid().';

COMMENT ON FUNCTION public.get_public_profile IS 
'Securely retrieves a public profile by user ID without exposing email addresses.';

COMMENT ON FUNCTION public.get_public_profiles IS 
'Batch retrieves multiple public profiles without exposing email addresses. Useful for displaying lists of users.';