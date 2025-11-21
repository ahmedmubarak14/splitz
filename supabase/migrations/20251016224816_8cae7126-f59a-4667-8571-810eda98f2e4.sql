-- Add username to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$'),
ADD CONSTRAINT username_lowercase CHECK (username = LOWER(username));

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create index for friendship queries
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- Create friend invites table
CREATE TABLE public.friend_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text || clock_timestamp()::text) from 1 for 12),
  receiver_email TEXT,
  receiver_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  CHECK (receiver_id IS NOT NULL OR receiver_email IS NOT NULL OR receiver_username IS NOT NULL)
);

-- Create index for invite lookups
CREATE INDEX idx_friend_invites_code ON public.friend_invites(invite_code);
CREATE INDEX idx_friend_invites_sender ON public.friend_invites(sender_id);
CREATE INDEX idx_friend_invites_receiver ON public.friend_invites(receiver_id);

-- Enable RLS on new tables
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can accept friend requests"
ON public.friendships FOR UPDATE
USING (auth.uid() = friend_id AND status = 'pending');

CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for friend_invites
CREATE POLICY "Users can view their own sent invites"
ON public.friend_invites FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create invites"
ON public.friend_invites FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received invites"
ON public.friend_invites FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view invites by code"
ON public.friend_invites FOR SELECT
USING (true);

-- Update profiles RLS to allow friends to see each other
CREATE POLICY "Users can view friends profiles"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT friend_id FROM public.friendships 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR 
  id IN (
    SELECT user_id FROM public.friendships 
    WHERE friend_id = auth.uid() AND status = 'accepted'
  )
);

-- Function to check username availability
CREATE OR REPLACE FUNCTION public.is_username_available(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = LOWER(username_to_check)
  );
$$;

-- Function to search users by username
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, full_name, avatar_url
  FROM public.profiles
  WHERE username ILIKE search_term || '%'
    AND username IS NOT NULL
    AND id != auth.uid()
  LIMIT 20;
$$;

-- Function to get friend status between two users
CREATE OR REPLACE FUNCTION public.get_friendship_status(other_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.friendships 
     WHERE user_id = auth.uid() AND friend_id = other_user_id),
    (SELECT 
       CASE 
         WHEN status = 'pending' THEN 'pending_received'
         ELSE status
       END
     FROM public.friendships 
     WHERE user_id = other_user_id AND friend_id = auth.uid()),
    'none'
  );
$$;