-- Fix INSERT policy for expenses table to allow users to create their own expenses
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
CREATE POLICY "Users can create expenses"
ON expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);