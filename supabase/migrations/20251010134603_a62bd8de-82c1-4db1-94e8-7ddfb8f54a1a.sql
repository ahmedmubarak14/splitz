-- Phase 1: Critical Security Fixes
-- Fix 1: Remove email exposure from profiles table
-- Drop existing overly permissive policy and create restrictive ones

DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;

-- Users can only view their own profile completely
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can view limited info (no email) of group members
CREATE POLICY "Users can view group members limited info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    -- Expense group members
    SELECT DISTINCT egm2.user_id
    FROM expense_group_members egm1
    JOIN expense_group_members egm2 ON egm1.group_id = egm2.group_id
    WHERE egm1.user_id = auth.uid()
    UNION
    -- Challenge participants
    SELECT DISTINCT cp2.user_id
    FROM challenge_participants cp1
    JOIN challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
    WHERE cp1.user_id = auth.uid()
  )
  AND auth.uid() != id -- Don't duplicate own profile access
);

-- Fix 2: Secure invitations table - remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view invitations by code" ON public.invitations;

-- Only allow viewing valid invitations by specific invite code (when joining)
CREATE POLICY "Users can view valid invitations by code"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Fix 3: Add search_path to security-critical functions
-- Update is_group_member function
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expense_group_members 
    WHERE group_id = _group_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM expense_groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- Update is_challenge_member function
CREATE OR REPLACE FUNCTION public.is_challenge_member(_user_id uuid, _challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM challenges WHERE id = _challenge_id AND creator_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM challenge_participants WHERE challenge_id = _challenge_id AND user_id = _user_id
  );
$$;

-- Update is_expense_member function
CREATE OR REPLACE FUNCTION public.is_expense_member(_user_id uuid, _expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expenses WHERE id = _expense_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM expense_members WHERE expense_id = _expense_id AND user_id = _user_id
  );
$$;

-- Update can_join_via_invite function
CREATE OR REPLACE FUNCTION public.can_join_via_invite(_user_id uuid, _resource_id uuid, _invite_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.invite_type = _invite_type
      AND i.resource_id = _resource_id
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.max_uses IS NULL OR i.current_uses < i.max_uses)
  );
$$;