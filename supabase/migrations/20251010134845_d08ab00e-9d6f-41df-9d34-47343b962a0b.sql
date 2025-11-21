-- Phase 1 Security Fix: Properly restrict invitations table access
-- Remove the overly permissive policy that allows viewing all valid invitations
DROP POLICY IF EXISTS "Users can view valid invitations by code" ON public.invitations;

-- The only SELECT policy should be for creators viewing their own invitations
-- The "Users can view their own invitations" policy already exists and is sufficient
-- Joining via invite code is handled by can_join_via_invite() function which has SECURITY DEFINER

-- Add comment to document the security model
COMMENT ON TABLE public.invitations IS 'Invitation codes are validated via can_join_via_invite() function. Direct SELECT is restricted to creators only for security.';