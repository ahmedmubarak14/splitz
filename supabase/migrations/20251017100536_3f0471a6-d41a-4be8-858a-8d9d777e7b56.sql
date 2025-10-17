-- Fix RLS policy to allow recipients to accept friend requests safely
DROP POLICY IF EXISTS "Users can accept friend requests" ON public.friendships;

CREATE POLICY "Users can accept friend requests"
ON public.friendships
FOR UPDATE
USING (
  auth.uid() = friend_id
  AND status = 'pending'
)
WITH CHECK (
  -- After update, the same recipient must still be the friend_id
  auth.uid() = friend_id
  AND status IN ('accepted','pending')
);
