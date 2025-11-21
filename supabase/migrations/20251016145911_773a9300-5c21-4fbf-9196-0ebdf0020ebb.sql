-- Fix infinite recursion in subscription RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view shared subscriptions they contribute to" ON subscriptions;
DROP POLICY IF EXISTS "Users can view contributors for their shared subscriptions" ON subscription_contributors;

-- Create simpler, non-recursive policies for subscriptions
-- Users can view their own subscriptions (already exists, but let's make sure)
-- This policy already exists: "Users can view their own subscriptions"

-- Create a simpler policy for viewing shared subscriptions
-- Users can view shared subscriptions where they are contributors
CREATE POLICY "Contributors can view shared subscriptions they are part of"
ON subscriptions FOR SELECT
USING (
  is_shared = true 
  AND id IN (
    SELECT subscription_id 
    FROM subscription_contributors 
    WHERE user_id = auth.uid()
  )
);

-- Create simpler policy for subscription_contributors
-- Users can view contributors for subscriptions they own
CREATE POLICY "Subscription owners can view all contributors"
ON subscription_contributors FOR SELECT
USING (
  subscription_id IN (
    SELECT id 
    FROM subscriptions 
    WHERE user_id = auth.uid()
  )
);

-- Contributors can view other contributors for shared subscriptions they are part of
CREATE POLICY "Contributors can view fellow contributors"
ON subscription_contributors FOR SELECT
USING (
  subscription_id IN (
    SELECT subscription_id 
    FROM subscription_contributors 
    WHERE user_id = auth.uid()
  )
);