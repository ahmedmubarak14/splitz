-- Fix remaining functions with mutable search paths
ALTER FUNCTION public.is_expense_member(_user_id uuid, _expense_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.can_join_via_invite(_user_id uuid, _resource_id uuid, _invite_type text) 
SET search_path = 'public';