-- Fix search_path for existing security definer functions
ALTER FUNCTION public.is_group_member(_user_id uuid, _group_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.is_challenge_member(_user_id uuid, _challenge_id uuid) 
SET search_path = 'public';