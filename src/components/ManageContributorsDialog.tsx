import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionSplitTypeSelector } from './SubscriptionSplitTypeSelector';

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
      // Find user by email (using the email column we just added)
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchEmail.trim().toLowerCase())
        .single();

      if (userError || !user) {
        throw new Error('User not found with this email');
      }

      // Check if already a contributor
      const { data: existing } = await supabase
        .from('subscription_contributors')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('User is already a contributor');
      }

      // Add contributor
      const { error } = await supabase
        .from('subscription_contributors')
        .insert({
          subscription_id: subscriptionId,
          user_id: user.id,
          contribution_amount: parseFloat(contributionAmount),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors'] });
      toast.success('Contributor added successfully');
      setSearchEmail('');
      setContributionAmount('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add contributor');
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
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors'] });
      toast.success('Contributor removed');
    },
    onError: () => {
      toast.error('Failed to remove contributor');
    },
  });

  const handleAddContributor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail || !contributionAmount) {
      toast.error('Please fill in all fields');
      return;
    }
    addContributor.mutate();
  };

  const totalContributions = contributors?.reduce((sum, c) => sum + Number(c.contribution_amount), 0) || 0;
  const remainingAmount = totalAmount - totalContributions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Contributors - {subscriptionName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Split Type Selector */}
          {subscription && contributors && contributors.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Split Configuration</h3>
              <SubscriptionSplitTypeSelector
                totalAmount={totalAmount}
                currency={subscription.currency}
                members={contributors.map(c => ({
                  user_id: c.user_id,
                  full_name: (c as any).profile?.full_name || 'Unknown'
                }))}
                onSplitsChange={async (splits, splitType) => {
                  // Update split type in subscription
                  await supabase
                    .from('subscriptions')
                    .update({ split_type: splitType })
                    .eq('id', subscriptionId);

                  // Update contributor split values and amounts
                  for (const split of splits) {
                    await supabase
                      .from('subscription_contributors')
                      .update({
                        split_value: split.split_value,
                        contribution_amount: split.calculated_amount
                      })
                      .eq('subscription_id', subscriptionId)
                      .eq('user_id', split.user_id);
                  }

                  queryClient.invalidateQueries({ queryKey: ['subscription-contributors'] });
                  queryClient.invalidateQueries({ queryKey: ['subscription-details'] });
                  toast.success('Split updated successfully');
                }}
                initialSplitType={subscription.split_type || 'equal'}
                initialSplits={contributors.map(c => ({
                  user_id: c.user_id,
                  split_value: c.split_value
                }))}
              />
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Covered</p>
              <p className="text-2xl font-bold text-success">{totalContributions.toFixed(2)}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-warning">{remainingAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Add Contributor Form */}
          <form onSubmit={handleAddContributor} className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Contributor
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label htmlFor="contribution">Contribution Amount</Label>
                <Input
                  id="contribution"
                  type="number"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder={remainingAmount > 0 ? remainingAmount.toFixed(2) : '0.00'}
                />
              </div>
            </div>

            <Button type="submit" disabled={addContributor.isPending} className="w-full">
              {addContributor.isPending ? 'Adding...' : 'Add Contributor'}
            </Button>
          </form>

          {/* Contributors List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Contributors ({contributors?.length || 0})</h3>
            
            {contributors && contributors.length > 0 ? (
              <div className="space-y-2">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={(contributor as any).profile?.avatar_url} />
                        <AvatarFallback>
                          {(contributor as any).profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {(contributor as any).profile?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Contributes: {Number(contributor.contribution_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {contributor.is_settled ? (
                        <Badge variant="secondary">Paid</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContributor.mutate(contributor.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No contributors yet. Add someone to share this subscription!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageContributorsDialog;
