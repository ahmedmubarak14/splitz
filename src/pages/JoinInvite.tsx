import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';

const JoinInvite = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [resourceDetails, setResourceDetails] = useState<any>(null);
  const [autoJoinTried, setAutoJoinTried] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [inviteCode]);

  const fetchInvitation = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth page with return URL
        navigate(`/auth?return=/join/${inviteCode}`);
        return;
      }

      // Fetch invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (inviteError) {
        console.error('Error fetching invitation:', inviteError);
        toast.error('Failed to load invitation');
        navigate('/');
        return;
      }

      if (!inviteData) {
        toast.error('Invalid or expired invitation');
        navigate('/');
        return;
      }

      // Check if invitation is expired
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        navigate('/');
        return;
      }

      setInvitation(inviteData);

      // Fetch resource details based on type
      if (inviteData.invite_type === 'challenge') {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', inviteData.resource_id)
          .single();
        setResourceDetails(challenge);
      } else if (inviteData.invite_type === 'expense') {
        const { data: expense } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', inviteData.resource_id)
          .single();
        setResourceDetails(expense);
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast.error('Failed to load invitation');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Auto-join once the user is authenticated and invitation is loaded
  useEffect(() => {
    if (!loading && invitation && !autoJoinTried) {
      setAutoJoinTried(true);
      joinResource();
    }
  }, [loading, invitation, autoJoinTried]);

  const joinResource = async () => {
    if (!invitation) return;

    setJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (invitation.invite_type === 'challenge') {
        // Add user as challenge participant
        const { error } = await supabase
          .from('challenge_participants')
          .insert({
            challenge_id: invitation.resource_id,
            user_id: user.id,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('You are already a participant in this challenge');
          } else {
            throw error;
          }
        } else {
          // Update invitation uses
          await supabase
            .from('invitations')
            .update({ current_uses: invitation.current_uses + 1 })
            .eq('id', invitation.id);

          toast.success('Successfully joined the challenge! 🎉');
          navigate('/challenges');
        }
      } else if (invitation.invite_type === 'expense') {
        // Add user as expense GROUP member
        const { error } = await supabase
          .from('expense_group_members')
          .insert({
            group_id: invitation.resource_id,
            user_id: user.id,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('You are already a member of this group');
          } else {
            throw error;
          }
        } else {
          // Update invitation uses safely
          await supabase
            .from('invitations')
            .update({ current_uses: (invitation.current_uses || 0) + 1 })
            .eq('id', invitation.id);

          toast.success('Successfully joined the expense group! 💰');
          navigate('/expenses');
        }
      }
    } catch (error) {
      console.error('Error joining:', error);
      toast.error('Failed to join. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-primary">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">
            {invitation?.invite_type === 'challenge' ? 'Join Challenge' : 'Join Expense Group'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            You've been invited to join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resourceDetails && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
              <h3 className="text-2xl font-bold mb-2">{resourceDetails.name}</h3>
              {resourceDetails.description && (
                <p className="text-muted-foreground">{resourceDetails.description}</p>
              )}
              {invitation.invite_type === 'challenge' && resourceDetails.start_date && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>
                    {new Date(resourceDetails.start_date).toLocaleDateString()} - {new Date(resourceDetails.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={joinResource}
            disabled={joining}
            className="w-full h-12 text-lg"
            variant="gradient"
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Join Now
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-12"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinInvite;
