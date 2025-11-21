-- Fix expense_members RLS policy to allow group members to insert members when creating expenses

-- Add policy to allow group members to insert expense members for expenses in their group
CREATE POLICY "Group members can add expense members"
  ON public.expense_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_members.expense_id 
      AND is_group_member(auth.uid(), e.group_id)
    )
  );