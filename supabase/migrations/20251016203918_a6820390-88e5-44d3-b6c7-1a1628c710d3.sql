-- Add RLS policy to allow co-contributors to view each other's profiles
CREATE POLICY "Co-contributors can view shared profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT sc2.user_id
    FROM subscription_contributors sc1
    JOIN subscription_contributors sc2 ON sc1.subscription_id = sc2.subscription_id
    WHERE sc1.user_id = auth.uid()
  ) AND auth.uid() <> id
);

-- Add RLS policy to allow subscription owners to view contributor profiles
CREATE POLICY "Subscription owners can view contributor profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT sc.user_id
    FROM subscriptions s
    JOIN subscription_contributors sc ON sc.subscription_id = s.id
    WHERE s.user_id = auth.uid()
  )
);