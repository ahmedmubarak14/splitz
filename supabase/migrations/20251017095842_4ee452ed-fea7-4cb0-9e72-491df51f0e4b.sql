-- Allow users to view profiles of their friends and people they have pending requests with
CREATE POLICY "Users can view profiles of friends and pending requests"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = auth.uid() AND friend_id = profiles.id)
       OR (friend_id = auth.uid() AND user_id = profiles.id)
  )
);

-- Also allow viewing profiles of users in search results (for friend requests)
CREATE POLICY "Users can search other profiles"
ON public.profiles
FOR SELECT
USING (true);