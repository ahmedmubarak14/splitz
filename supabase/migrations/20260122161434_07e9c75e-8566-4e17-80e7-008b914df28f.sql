-- Fix overly permissive INSERT policy on user_activity table
-- The current policy WITH CHECK (true) allows any authenticated user to insert records for any user
-- This creates a security risk where users could log fake activity for other users

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity;

-- Create a properly scoped policy that:
-- 1. Allows users to only insert activity records for themselves
-- 2. The SECURITY DEFINER function log_user_activity() bypasses RLS, so it can still insert for system operations
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);