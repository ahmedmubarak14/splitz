-- Fix CRITICAL security issue: profiles table publicly exposing email addresses
-- Remove the "OR true" condition that makes all profiles public

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create a new policy that ONLY allows users to view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy for viewing PUBLIC profile info of others (no email!)
-- This uses the existing public_profiles view or we rely on get_public_profile() function
-- Note: We'll update code to use get_public_profile() function instead of direct queries

-- Fix public_profiles view to ensure it doesn't expose sensitive data
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate public_profiles as a secure view (no email, no sensitive data)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  preferred_language,
  created_at,
  updated_at,
  onboarding_completed
FROM public.profiles;

-- Grant SELECT on public_profiles to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add RLS to email_log to prevent user inserts (only system can insert)
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_log;

CREATE POLICY "System can insert email logs"
ON public.email_log
FOR INSERT
TO authenticated
WITH CHECK (false);  -- No users can insert, only service role

-- Split push_tokens ALL policy into specific policies for better security
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;

CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Restrict subscription_documents access to uploader and subscription owner only
DROP POLICY IF EXISTS "Users can manage documents for their subscriptions" ON public.subscription_documents;

CREATE POLICY "Users can view their own subscription documents"
ON public.subscription_documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE id = subscription_documents.subscription_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents for their subscriptions"
ON public.subscription_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE id = subscription_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own documents"
ON public.subscription_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.subscription_documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE id = subscription_documents.subscription_id AND user_id = auth.uid()
  )
);