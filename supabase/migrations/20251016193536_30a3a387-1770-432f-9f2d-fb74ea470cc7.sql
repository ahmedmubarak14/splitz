-- Allow subscription and trip invite types
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_invite_type_check;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invite_type_check 
CHECK (invite_type IN ('challenge', 'expense', 'subscription', 'trip'));