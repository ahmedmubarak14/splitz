-- Fix expense edit permissions: Only creators can update their own expenses
DROP POLICY IF EXISTS "Group members can update expenses" ON expenses;

CREATE POLICY "Only expense creators can update expenses"
ON expenses 
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Fix settlement permissions: Only the payer can update settlement status
DROP POLICY IF EXISTS "Expense members can update their settlement status" ON expense_members;

CREATE POLICY "Expense payer can update settlement status"
ON expense_members 
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = expense_members.expense_id 
    AND e.paid_by = auth.uid()
  )
);