-- Update expenses RLS policy to allow collaborative editing
-- Allow expense creator, payer, and group creator to update expenses

DROP POLICY IF EXISTS "Only expense creators can update expenses" ON expenses;

CREATE POLICY "Expense collaborators can update expenses" ON expenses
  FOR UPDATE
  USING (
    user_id = auth.uid() OR -- Original creator
    paid_by = auth.uid() OR -- Person who paid
    EXISTS (
      SELECT 1 FROM expense_groups eg
      WHERE eg.id = expenses.group_id
      AND eg.created_by = auth.uid() -- Group creator
    )
  );