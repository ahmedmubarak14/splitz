-- Fix email_log INSERT policy to allow service role / edge functions to insert email logs
-- Drop the overly restrictive policy first
DROP POLICY IF EXISTS "Email logs can be inserted by authenticated users" ON public.email_log;
DROP POLICY IF EXISTS "email_log_insert_policy" ON public.email_log;

-- Check all policies on email_log and recreate properly
-- Allow authenticated users to view their own email logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_log;
CREATE POLICY "Users can view their own email logs"
ON public.email_log
FOR SELECT
USING (auth.uid() = user_id);

-- Allow INSERT for edge functions (service role bypasses RLS) and authenticated users inserting their own logs
CREATE POLICY "Allow email log inserts for own user"
ON public.email_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);