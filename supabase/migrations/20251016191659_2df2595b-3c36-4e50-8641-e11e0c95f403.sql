-- Add RLS policy to allow users to join subscriptions via invite link
CREATE POLICY "Invited users can join subscriptions"
ON public.subscription_contributors
FOR INSERT
WITH CHECK (can_join_via_invite(auth.uid(), subscription_id, 'subscription'));