-- =============================================
-- FIX 1: Revoke anonymous access to get_email_by_username
-- =============================================
-- This prevents unauthenticated users from enumerating emails via usernames

REVOKE EXECUTE ON FUNCTION public.get_email_by_username(TEXT) FROM anon;

-- Ensure only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated;

-- =============================================
-- FIX 2: Fix invitation bypass vulnerability
-- =============================================
-- Create a table to track validated invite codes per user session
-- This ensures users can only join resources they have validated invite codes for

CREATE TABLE IF NOT EXISTS public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invite_code TEXT NOT NULL,
  resource_id UUID NOT NULL,
  invite_type TEXT NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  UNIQUE(user_id, invite_code)
);

-- Enable RLS
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.invite_redemptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own redemptions (when validating a code)
CREATE POLICY "Users can validate invites"
ON public.invite_redemptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own redemptions (mark as redeemed)
CREATE POLICY "Users can redeem invites"
ON public.invite_redemptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create a function to validate and record an invite code
CREATE OR REPLACE FUNCTION public.validate_invite_code(_invite_code TEXT)
RETURNS TABLE(
  id UUID,
  invite_code TEXT,
  invite_type TEXT,
  resource_id UUID,
  created_by UUID,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get valid invitation
  SELECT i.* INTO v_invite
  FROM public.invitations i
  WHERE i.invite_code = _invite_code
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND (i.max_uses IS NULL OR i.current_uses < i.max_uses)
  LIMIT 1;

  IF v_invite IS NULL THEN
    RETURN;
  END IF;

  -- Record the validation (upsert to handle re-validations)
  INSERT INTO public.invite_redemptions (user_id, invite_code, resource_id, invite_type)
  VALUES (v_user_id, _invite_code, v_invite.resource_id, v_invite.invite_type)
  ON CONFLICT (user_id, invite_code) DO UPDATE SET validated_at = now();

  -- Return invitation details
  RETURN QUERY
  SELECT 
    v_invite.id,
    v_invite.invite_code,
    v_invite.invite_type,
    v_invite.resource_id,
    v_invite.created_by,
    v_invite.expires_at,
    v_invite.max_uses,
    v_invite.current_uses,
    v_invite.created_at;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT) TO authenticated;

-- Create new secure function to check if user can join via validated invite
CREATE OR REPLACE FUNCTION public.has_validated_invite(_user_id UUID, _resource_id UUID, _invite_type TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.invite_redemptions ir
    JOIN public.invitations i ON i.invite_code = ir.invite_code
    WHERE ir.user_id = _user_id
      AND ir.resource_id = _resource_id
      AND ir.invite_type = _invite_type
      AND ir.redeemed_at IS NULL  -- Not yet redeemed
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.max_uses IS NULL OR i.current_uses < i.max_uses)
  );
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.has_validated_invite(UUID, UUID, TEXT) TO authenticated;

-- Update can_join_via_invite to use the new validation check
-- This now requires users to have validated their invite code first
CREATE OR REPLACE FUNCTION public.can_join_via_invite(_user_id UUID, _resource_id UUID, _invite_type TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- User must have a validated (but not redeemed) invite for this specific resource
  SELECT public.has_validated_invite(_user_id, _resource_id, _invite_type);
$$;

-- Function to mark invite as redeemed after successful join
CREATE OR REPLACE FUNCTION public.mark_invite_redeemed(_resource_id UUID, _invite_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.invite_redemptions
  SET redeemed_at = now()
  WHERE user_id = auth.uid()
    AND resource_id = _resource_id
    AND invite_type = _invite_type
    AND redeemed_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_invite_redeemed(UUID, TEXT) TO authenticated;