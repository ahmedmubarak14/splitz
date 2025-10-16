import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Trash2, Mail, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionSplitTypeSelector } from './SubscriptionSplitTypeSelector';
import { InviteDialog } from './InviteDialog';
import type { SplitType, MemberSplit } from './SubscriptionSplitTypeSelector';

interface ManageContributorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
  totalAmount: number;
}

const ManageContributorsDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName,
  totalAmount,
}: ManageContributorsDialogProps) => {
  const queryClient = useQueryClient();
  const [contributionAmount, setContributionAmount] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

  // Fetch subscription details for split type
  const { data: subscription } = useQuery({
    queryKey: ['subscription-details', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('split_type, currency')
        .eq('id', subscriptionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch contributors
  const { data: contributors } = useQuery({
    queryKey: ['subscription-contributors', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_contributors')
        .select('id, user_id, contribution_amount, is_settled, paid_at, split_value')
        .eq('subscription_id', subscriptionId);

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        return data.map(contributor => ({
          ...contributor,
          profile: profiles?.find(p => p.id === contributor.user_id)
        }));
      }

      return data;
    },
    enabled: open,
  });

  // Add contributor
  const addContributor = useMutation({
    mutationFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Find user by email (using maybeSingle instead of single)
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (userError) {
        throw new Error('Error searching for user');
      }

      if (!user) {
        setUserNotFound(true);
        throw new Error('User not found with this email');
      }

      // Check if already a contributor
      const { data: existing } = await supabase
        .from('subscription_contributors')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        throw new Error('User is already a contributor');
      }

      // Add new contributor
      const { error: insertError } = await supabase
        .from('subscription_contributors')
        .insert({
          subscription_id: subscriptionId,
          user_id: user.id,
          contribution_amount: parseFloat(contributionAmount) || 0,
          split_value: parseFloat(contributionAmount),
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSearchEmail('');
      setContributionAmount('');
      setUserNotFound(false);
      toast.success('Contributor added successfully');
    },
    onError: (error: Error) => {
      if (error.message !== 'User not found with this email') {
        toast.error(error.message);
        setUserNotFound(false);
      }
    },
  });

  // Remove contributor
  const removeContributor = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .delete()
        .eq('id', contributorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Contributor removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update split type
  const updateSplitType = useMutation({
    mutationFn: async ({ newSplitType, newSplits }: { newSplitType: SplitType; newSplits: MemberSplit[] }) => {
      // Update subscription split type
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ split_type: newSplitType })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Update each contributor's split_value and contribution_amount
      for (const split of newSplits) {
        const { error } = await supabase
          .from('subscription_contributors')
          .update({
            split_value: split.split_value,
            contribution_amount: split.calculated_amount,
          })
          .eq('user_id', split.user_id)
          .eq('subscription_id', subscriptionId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-details', subscriptionId] });
      toast.success('Split type updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSplitsChange = (newSplits: MemberSplit[]) => {
    setMemberSplits(newSplits);
    updateSplitType.mutate({ newSplitType: splitType, newSplits });
  };

  const handleAddContributor = () => {
    if (!searchEmail) {
      toast.error('Please enter an email address');
      return;
    }
    addContributor.mutate();
  };

  const totalCovered = contributors?.reduce((sum, c) => sum + Number(c.contribution_amount || 0), 0) || 0;
  const remaining = totalAmount - totalCovered;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Contributors - {subscriptionName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Split Type Selector */}
            {subscription && contributors && (
              <div className="space-y-2">
                <Label>Split Type</Label>
                <SubscriptionSplitTypeSelector
                  totalAmount={totalAmount}
                  currency={subscription.currency || 'SAR'}
                  members={contributors.map(c => ({
                    user_id: c.user_id,
                    full_name: (c as any).profile?.full_name || 'Unknown',
                  }))}
                  onSplitsChange={handleSplitsChange}
                  initialSplitType={subscription.split_type as SplitType}
                  initialSplits={contributors.map(c => ({
                    user_id: c.user_id,
                    split_value: c.split_value || 0,
                  }))}
                />
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{subscription?.currency || 'SAR'} {totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Covered</p>
                <p className="text-lg font-semibold text-success">{subscription?.currency || 'SAR'} {totalCovered.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-lg font-semibold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                  {subscription?.currency || 'SAR'} {remaining.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Add Contributor Section */}
            <div className="space-y-2">
              <Label htmlFor="email">Add Contributor</Label>
              {userNotFound && (
                <Alert className="mb-4">
                  <AlertTitle>User not found</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>This email isn't registered yet. Would you like to invite them?</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInviteDialogOpen(true);
                          setUserNotFound(false);
                        }}
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        Send Invite
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUserNotFound(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button
                  onClick={handleAddContributor}
                  disabled={!searchEmail || addContributor.isPending}
                >
                  {addContributor.isPending ? (
                    'Adding...'
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                  className="flex-1"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Invite via Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Contributors List */}
            <div className="space-y-2">
              <Label>Current Contributors ({contributors?.length || 0})</Label>
              {!contributors || contributors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contributors yet. Add the first one above.
                </p>
              ) : (
                <div className="space-y-2">
                  {contributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={(contributor as any).profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {(contributor as any).profile?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{(contributor as any).profile?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription?.currency || 'SAR'} {Number(contributor.contribution_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contributor.is_settled ? (
                          <Badge className="bg-success text-success-foreground">Paid</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContributor.mutate(contributor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        resourceId={subscriptionId}
        resourceType="subscription"
        resourceName={subscriptionName}
      />
    </>
  );
};

export default ManageContributorsDialog;
