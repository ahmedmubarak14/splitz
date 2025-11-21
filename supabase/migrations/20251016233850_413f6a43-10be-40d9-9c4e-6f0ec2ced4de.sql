-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view invites by code" ON public.friend_invites;

-- Create secure function to get invite by code (only returns safe, necessary data)
CREATE OR REPLACE FUNCTION public.get_friend_invite_by_code(_invite_code TEXT)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fi.id,
    fi.sender_id,
    p.full_name as sender_name,
    p.avatar_url as sender_avatar,
    fi.status,
    fi.expires_at,
    fi.created_at
  FROM public.friend_invites fi
  LEFT JOIN public.profiles p ON p.id = fi.sender_id
  WHERE fi.invite_code = _invite_code
    AND fi.status = 'pending'
    AND (fi.expires_at IS NULL OR fi.expires_at > now())
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_friend_invite_by_code(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_friend_invite_by_code IS 
'Securely retrieves friend invite by code without exposing sensitive data like emails. Only returns active, non-expired invites with minimal sender information.';
