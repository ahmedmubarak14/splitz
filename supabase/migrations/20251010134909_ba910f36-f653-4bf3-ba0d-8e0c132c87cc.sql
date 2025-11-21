-- Create function to increment invitation uses
CREATE OR REPLACE FUNCTION public.increment_invitation_uses(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = _invitation_id;
END;
$$;