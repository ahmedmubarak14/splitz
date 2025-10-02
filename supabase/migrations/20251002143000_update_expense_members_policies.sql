-- Allow expense creators to delete members
CREATE POLICY IF NOT EXISTS "Expense creators can delete members"
  ON public.expense_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_members.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

