-- Create a secure function to validate and fetch invitation details
-- This allows users to view invitation details when they have the exact invite code
CREATE OR REPLACE FUNCTION public.get_invitation_by_code(_invite_code text)
RETURNS TABLE (
  id uuid,
  invite_code text,
  invite_type text,
  resource_id uuid,
  created_by uuid,
  expires_at timestamp with time zone,
  max_uses integer,
  current_uses integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    invite_code,
    invite_type,
    resource_id,
    created_by,
    expires_at,
    max_uses,
    current_uses,
    created_at
  FROM public.invitations
  WHERE invite_code = _invite_code
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  LIMIT 1;
$$;