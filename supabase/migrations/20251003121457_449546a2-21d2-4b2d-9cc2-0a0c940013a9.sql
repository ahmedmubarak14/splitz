-- Create expense groups table
CREATE TABLE IF NOT EXISTS public.expense_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense group members table
CREATE TABLE IF NOT EXISTS public.expense_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Modify expenses table to link to groups and track who paid
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS on new tables
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_group_members ENABLE ROW LEVEL SECURITY;

-- Drop old expense RLS policies
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expenses they created or are members of" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- Create function to check if user is group member
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expense_group_members 
    WHERE group_id = _group_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM expense_groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- RLS policies for expense_groups
CREATE POLICY "Users can create expense groups"
  ON public.expense_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view groups they're members of"
  ON public.expense_groups FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), id));

CREATE POLICY "Group creators can update their groups"
  ON public.expense_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON public.expense_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS policies for expense_group_members
CREATE POLICY "Group members can view other members"
  ON public.expense_group_members FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group creators can add members"
  ON public.expense_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expense_groups 
      WHERE id = group_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Invited users can join groups"
  ON public.expense_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    can_join_via_invite(auth.uid(), group_id, 'expense'::text)
  );

-- Updated RLS policies for expenses
CREATE POLICY "Group members can create expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (is_group_member(auth.uid(), group_id));

-- Update expense_members policies to use groups
DROP POLICY IF EXISTS "Expense creators can add members" ON public.expense_members;
DROP POLICY IF EXISTS "Users can view expense members for their expenses" ON public.expense_members;

CREATE POLICY "Group members can view expense members"
  ON public.expense_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = expense_id AND is_group_member(auth.uid(), e.group_id)
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_expense_groups_updated_at
  BEFORE UPDATE ON public.expense_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();