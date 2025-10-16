import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Trash2, Mail, Link2, Share2, AlertCircle } from 'lucide-react';
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  
  // Staged changes state
  const [pendingChanges, setPendingChanges] = useState(false);
  const [stagedSplitType, setStagedSplitType] = useState<SplitType>('equal');
  const [stagedMemberSplits, setStagedMemberSplits] = useState<MemberSplit[]>([]);

  // Fetch subscription details
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

  // Initialize staged split type from subscription
  useEffect(() => {
    if (subscription?.split_type && !pendingChanges) {
      setStagedSplitType(subscription.split_type as SplitType);
    }
  }, [subscription, pendingChanges]);

  // Fetch contributors with proper profile loading
  const { data: contributors, isLoading: contributorsLoading } = useQuery({
    queryKey: ['subscription-contributors', subscriptionId],
    queryFn: async () => {
      console.log('🔍 Fetching contributors for subscription:', subscriptionId);
      
      // Step 1: Get contributors
      const { data: contributorsData, error: contributorsError } = await supabase
        .from('subscription_contributors')
        .select('id, user_id, contribution_amount, is_settled, paid_at, split_value, payment_submitted')
        .eq('subscription_id', subscriptionId);

      if (contributorsError) {
        console.error('❌ Error fetching contributors:', contributorsError);
        throw contributorsError;
      }

      if (!contributorsData || contributorsData.length === 0) {
        console.log('⚠️ No contributors found');
        return [];
      }

      console.log('✅ Found contributors:', contributorsData.length);

      // Step 2: Get profiles separately
      const userIds = contributorsData.map(c => c.user_id);
      console.log('🔍 Fetching profiles for user IDs:', userIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('✅ Found profiles:', profiles?.length || 0);

      // Step 3: Merge data with fallback for missing profiles
      const result = contributorsData.map(contributor => {
        const profile = profiles?.find(p => p.id === contributor.user_id);
        if (!profile) {
          console.warn('⚠️ No profile found for user:', contributor.user_id);
        }
        return {
          ...contributor,
          profile: profile || null
        };
      });

      console.log('✅ Final contributors with profiles:', result);
      return result;
    },
    enabled: open,
  });

  // Add contributor
  const addContributor = useMutation({
    mutationFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Find user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (userError) throw new Error('Error searching for user');
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

      if (existing) throw new Error('User is already a contributor');

      // Add new contributor
      const { error: insertError } = await supabase
        .from('subscription_contributors')
        .insert({
          subscription_id: subscriptionId,
          user_id: user.id,
          contribution_amount: 0, // Will be recalculated
          split_value: null,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSearchEmail('');
      setUserNotFound(false);
      toast.success(t('subscriptions.contributorAdded'));
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
      toast.success(t('subscriptions.contributorRemoved'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update split type (only when saving)
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
      setPendingChanges(false);
      toast.success(t('subscriptions.changesSaved'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSplitsChange = (newSplits: MemberSplit[]) => {
    setStagedMemberSplits(newSplits);
    setPendingChanges(true);
  };

  const handleSaveChanges = () => {
    updateSplitType.mutate({ newSplitType: stagedSplitType, newSplits: stagedMemberSplits });
  };

  const handleCancelChanges = () => {
    setStagedSplitType(subscription?.split_type as SplitType || 'equal');
    setStagedMemberSplits([]);
    setPendingChanges(false);
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
            <DialogTitle>
              {t('subscriptions.manageContributors')} - {subscriptionName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Unsaved Changes Warning */}
            {pendingChanges && (
              <Alert variant="default" className="bg-warning/10 border-warning">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">{t('subscriptions.unsavedChanges')}</AlertTitle>
                <AlertDescription className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={updateSplitType.isPending}
                  >
                    {updateSplitType.isPending ? t('common.saving') : t('subscriptions.saveChanges')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelChanges}
                  >
                    {t('subscriptions.discardChanges')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Split Type Selector */}
            {subscription && contributors && contributors.length > 0 && (
              <div className="space-y-2">
                <Label>{t('subscriptions.splitType')}</Label>
                <SubscriptionSplitTypeSelector
                  totalAmount={totalAmount}
                  currency={subscription.currency || 'SAR'}
                  members={contributors.map(c => ({
                    user_id: c.user_id,
                    full_name: c.profile?.full_name || t('common.unknown'),
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
                <p className="text-sm text-muted-foreground">{t('subscriptions.total')}</p>
                <p className="text-lg font-semibold">
                  {subscription?.currency || 'SAR'} {totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('subscriptions.covered')}</p>
                <p className="text-lg font-semibold text-success">
                  {subscription?.currency || 'SAR'} {totalCovered.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('subscriptions.remaining')}</p>
                <p className={`text-lg font-semibold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                  {subscription?.currency || 'SAR'} {remaining.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Add Contributor Section */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('subscriptions.addContributor')}</Label>
              {userNotFound && (
                <Alert className="mb-4">
                  <AlertTitle>{t('subscriptions.userNotFoundTitle')}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{t('subscriptions.userNotFoundDesc')}</p>
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
                        {t('subscriptions.sendInvite')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUserNotFound(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder={t('subscriptions.enterEmail')}
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button
                  onClick={handleAddContributor}
                  disabled={!searchEmail || addContributor.isPending}
                >
                  {addContributor.isPending ? (
                    t('common.adding')
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t('common.add')}
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
                  {t('subscriptions.inviteViaLink')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('subscriptions.whatsapp')}
                </Button>
              </div>
            </div>

            {/* Contributors List */}
            <div className="space-y-2">
              <Label>
                {t('subscriptions.currentContributors')} ({contributors?.length || 0})
              </Label>
              {contributorsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('common.loading')}
                </p>
              ) : !contributors || contributors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('subscriptions.noContributors')}
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
                          <AvatarImage src={contributor.profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {contributor.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {contributor.profile?.full_name || t('common.unknown')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subscription?.currency || 'SAR'} {Number(contributor.contribution_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contributor.is_settled ? (
                          <Badge className="bg-success text-success-foreground">
                            {t('subscriptions.paid')}
                          </Badge>
                        ) : contributor.payment_submitted ? (
                          <Badge variant="secondary" className="bg-warning/20 text-warning">
                            {t('subscriptions.statusAwaitingApproval')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('subscriptions.pending')}</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContributor.mutate(contributor.id)}
                          disabled={removeContributor.isPending}
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
        payload={{
          split_type: subscription?.split_type || 'equal',
          split_value: 0
        }}
      />
    </>
  );
};

export default ManageContributorsDialog;
