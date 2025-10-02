-- Allow invited users to self-join challenges/expenses
-- 1) Helper function to validate active invite for a resource
CREATE OR REPLACE FUNCTION public.can_join_via_invite(
  _user_id uuid,
  _resource_id uuid,
  _invite_type text
) RETURNS boolean
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

-- 2) Policies to permit invited users to insert their own membership rows
DO $$ BEGIN
  -- Challenge participants
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'challenge_participants' AND policyname = 'Invited users can join challenges'
  ) THEN
    CREATE POLICY "Invited users can join challenges"
    ON public.challenge_participants
    FOR INSERT
    WITH CHECK (
      public.can_join_via_invite(auth.uid(), challenge_id, 'challenge')
    );
  END IF;

  -- Expense members
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'expense_members' AND policyname = 'Invited users can join expenses'
  ) THEN
    CREATE POLICY "Invited users can join expenses"
    ON public.expense_members
    FOR INSERT
    WITH CHECK (
      public.can_join_via_invite(auth.uid(), expense_id, 'expense')
    );
  END IF;
END $$;
