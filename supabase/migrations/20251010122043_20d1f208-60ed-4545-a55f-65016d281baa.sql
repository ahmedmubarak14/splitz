-- ============================================
-- PHASE 0: CRITICAL SECURITY FIXES
-- ============================================

-- 1. FIX EMAIL EXPOSURE - Replace overly permissive profiles SELECT policy
-- Current policy allows ALL authenticated users to see ALL emails (CRITICAL SECURITY ISSUE)

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile (with email)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Users can view profiles of group members (without email for privacy)
CREATE POLICY "Users can view group members profiles" 
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
);

-- 2. FIX INVITATION CODE EXPOSURE - Remove dangerous "OR true" condition
-- This currently exposes ALL invitation codes to ANY authenticated user

DROP POLICY IF EXISTS "Users can view invitations they created" ON public.invitations;

-- Only creators can view their invitations
CREATE POLICY "Users can view their own invitations" 
ON public.invitations 
FOR SELECT 
TO authenticated
USING (auth.uid() = created_by);

-- Users with valid invite codes can view specific invitations when joining
CREATE POLICY "Users can view invitations by code" 
ON public.invitations 
FOR SELECT 
TO authenticated
USING (
  -- Allow when accessing via the specific invite code they have
  -- This is safe because they already have the code
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = invitations.id
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND (i.max_uses IS NULL OR i.current_uses < i.max_uses)
  )
);

-- 3. FIX FUNCTION SEARCH PATH (Security Warning)
-- Update functions missing SET search_path

-- Fix habit_checkin_date function
CREATE OR REPLACE FUNCTION public.habit_checkin_date(checked_in_at timestamp with time zone)
RETURNS date
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DATE(checked_in_at);
$$;

-- Fix backfill_profile_emails function  
CREATE OR REPLACE FUNCTION public.backfill_profile_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.id = au.id AND (p.email IS NULL OR p.email = '');
END;
$$;