import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check, X, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";

interface InviteData {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function JoinFriendInvite() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvite();
  }, [inviteCode]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth?return=/join-friend/${inviteCode}`);
        return;
      }

      // Use secure RPC function to get invite details
      const { data, error: rpcError } = await supabase
        .rpc('get_friend_invite_by_code', { _invite_code: inviteCode })
        .maybeSingle();

      if (rpcError) {
        console.error('Error fetching invite:', rpcError);
        setError('Failed to load invitation');
        return;
      }

      if (!data) {
        setError('Invalid or expired invitation code');
        return;
      }

      // Check if user is trying to accept their own invite
      if (data.sender_id === user.id) {
        setError('You cannot accept your own friend invitation');
        return;
      }

      setInvite(data);
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!invite) return;

    try {
      setAccepting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${invite.sender_id}),and(user_id.eq.${invite.sender_id},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          toast.info('You are already friends with this user');
        } else {
          toast.info('You already have a pending friend request with this user');
        }
        navigate('/friends');
        return;
      }

      // Create friendship
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user_id: invite.sender_id,
          friend_id: user.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        });

      if (friendshipError) throw friendshipError;

      // Update invite status
      const { error: updateError } = await supabase
        .from('friend_invites')
        .update({ 
          status: 'accepted',
          receiver_id: user.id
        })
        .eq('id', invite.id);

      if (updateError) console.error('Error updating invite status:', updateError);

      toast.success(`You are now friends with ${invite.sender_name}!`);
      navigate('/friends');
    } catch (err) {
      console.error('Error accepting invite:', err);
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const declineInvite = () => {
    navigate('/friends');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <>
        <SEO 
          title="Friend Invitation - Splitz"
          description="Join your friend on Splitz"
        />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <X className="h-5 w-5" />
                Invalid Invitation
              </CardTitle>
              <CardDescription>
                {error || 'This invitation link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/friends')} className="w-full">
                Go to Friends
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Friend Invitation - Splitz"
        description="Accept friend invitation on Splitz"
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Friend Invitation
            </CardTitle>
            <CardDescription>
              You've been invited to connect on Splitz!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={invite.sender_avatar} />
                <AvatarFallback>
                  {invite.sender_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">{invite.sender_name}</p>
                <p className="text-sm text-muted-foreground">wants to be friends</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={acceptInvite}
                disabled={accepting}
                className="flex-1"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                onClick={declineInvite}
                variant="outline"
                disabled={accepting}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
