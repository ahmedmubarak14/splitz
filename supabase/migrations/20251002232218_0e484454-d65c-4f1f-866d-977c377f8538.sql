-- Fix infinite recursion in challenges and expenses RLS policies

-- First, create security definer functions to check permissions without recursion

-- Function to check if user is challenge creator or participant
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

-- Function to check if user is expense creator or member
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

-- Drop and recreate challenges policies
DROP POLICY IF EXISTS "Users can view challenges they created or participate in" ON challenges;
CREATE POLICY "Users can view challenges they created or participate in"
ON challenges
FOR SELECT
USING (public.is_challenge_member(auth.uid(), id));

-- Drop and recreate challenge_participants policies
DROP POLICY IF EXISTS "Users can view participants for their challenges" ON challenge_participants;
CREATE POLICY "Users can view participants for their challenges"
ON challenge_participants
FOR SELECT
USING (public.is_challenge_member(auth.uid(), challenge_id));

DROP POLICY IF EXISTS "Challenge creators can add participants" ON challenge_participants;
CREATE POLICY "Challenge creators can add participants"
ON challenge_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM challenges WHERE id = challenge_id AND creator_id = auth.uid()
  )
);

-- Drop and recreate expenses policies
DROP POLICY IF EXISTS "Users can view expenses they created or are members of" ON expenses;
CREATE POLICY "Users can view expenses they created or are members of"
ON expenses
FOR SELECT
USING (public.is_expense_member(auth.uid(), id));

-- Drop and recreate expense_members policies
DROP POLICY IF EXISTS "Users can view expense members for their expenses" ON expense_members;
CREATE POLICY "Users can view expense members for their expenses"
ON expense_members
FOR SELECT
USING (public.is_expense_member(auth.uid(), expense_id));

DROP POLICY IF EXISTS "Expense creators can add members" ON expense_members;
CREATE POLICY "Expense creators can add members"
ON expense_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses WHERE id = expense_id AND user_id = auth.uid()
  )
);

-- Add missing icon column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon text DEFAULT '⭐';