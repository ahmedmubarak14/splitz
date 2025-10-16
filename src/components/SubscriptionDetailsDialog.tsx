import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, Bell, CheckCircle, XCircle, Clock, Check, X } from "lucide-react";
import { format } from "date-fns";

interface SubscriptionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
}

export const SubscriptionDetailsDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName
}: SubscriptionDetailsDialogProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch subscription details
  const { data: subscription } = useQuery({
    queryKey: ['subscription-details', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const isOwner = currentUser?.id === subscription?.user_id;

  // Fetch owner profile
  const { data: ownerProfile } = useQuery({
    queryKey: ['profile', subscription?.user_id],
    queryFn: async () => {
      if (!subscription?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', subscription.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!subscription?.user_id
  });

  // Fetch contributors
  const { data: contributors = [] } = useQuery({
    queryKey: ['subscription-contributors', subscriptionId],
    queryFn: async () => {
      // Step 1: Get contributors
      const { data: contributorsData, error: contributorsError } = await supabase
        .from('subscription_contributors')
        .select('*')
        .eq('subscription_id', subscriptionId);

      if (contributorsError) throw contributorsError;
      if (!contributorsData || contributorsData.length === 0) return [];

      // Step 2: Get profiles separately
      const userIds = contributorsData.map(c => c.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Step 3: Merge data
      return contributorsData.map(contributor => ({
        ...contributor,
        profiles: profiles?.find(p => p.id === contributor.user_id) || null
      }));
    },
    enabled: open
  });

  // Submit payment (for contributors)
  const submitPayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .update({
          payment_submitted: true,
          submission_at: new Date().toISOString(),
        })
        .eq('id', contributorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      toast.success(t('subscriptions.paymentSubmitted'));
    }
  });

  // Approve payment (for owners)
  const approvePayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .update({
          is_settled: true,
          approved_at: new Date().toISOString(),
          paid_at: new Date().toISOString()
        })
        .eq('id', contributorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      toast.success(t('subscriptions.paymentApproved'));
    }
  });

  // Reject payment (for owners)
  const rejectPayment = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .update({
          payment_submitted: false,
          submission_at: null,
        })
        .eq('id', contributorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      toast.success(t('subscriptions.paymentRejected'));
    }
  });

  // Mark own payment as paid (owner self-settlement)
  const markAsPaid = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .update({
          payment_submitted: true,
          is_settled: true,
          submission_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        })
        .eq('id', contributorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      toast.success(t('subscriptions.paymentStatusUpdated'));
    }
  });

  // Send reminder
  const sendReminder = useMutation({
    mutationFn: async (contributorId: string) => {
      const { error } = await supabase.functions.invoke('send-subscription-reminder', {
        body: { contributorId }
      });
      if (error) throw error;

      // Update last_reminder_sent
      await supabase
        .from('subscription_contributors')
        .update({ last_reminder_sent: new Date().toISOString() })
        .eq('id', contributorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-contributors', subscriptionId] });
      toast.success(t('subscriptions.reminderSent'));
    }
  });

  const totalCovered = contributors.reduce((sum, c) => sum + (c.is_settled ? Number(c.contribution_amount) : 0), 0);
  const totalRemaining = Number(subscription?.amount || 0) - totalCovered;
  const settledCount = contributors.filter(c => c.is_settled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{subscriptionName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('subscriptions.overview')}</TabsTrigger>
            <TabsTrigger value="contributors">{t('subscriptions.contributors')}</TabsTrigger>
            <TabsTrigger value="history">{t('subscriptions.paymentHistory')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-sm text-muted-foreground mb-1">{t('subscriptions.totalAmount')}</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(subscription?.amount || 0), subscription?.currency || 'SAR', i18n.language)}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-sm text-muted-foreground mb-1">{t('subscriptions.billingCycle')}</div>
                <div className="text-2xl font-bold capitalize">{subscription?.billing_cycle}</div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm text-green-700 mb-1">{t('subscriptions.covered')}</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(totalCovered, subscription?.currency || 'SAR', i18n.language)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {settledCount} / {contributors.length} {t('subscriptions.paid')}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-sm text-amber-700 mb-1">{t('subscriptions.remaining')}</div>
                <div className="text-2xl font-bold text-amber-700">
                  {formatCurrency(totalRemaining, subscription?.currency || 'SAR', i18n.language)}
                </div>
              </div>
            </div>

            <div className="border-b pb-4 mb-4">
              <h3 className="text-lg font-semibold mb-3">{t("subscriptions.subscriptionDetails")}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={ownerProfile?.avatar_url || ""} />
                    <AvatarFallback>{ownerProfile?.full_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm text-muted-foreground">{t("subscriptions.owner")}</div>
                    <div className="font-medium">{ownerProfile?.full_name || t("common.unknown")}</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("subscriptions.createdOn")}:</span>
                  <span>{new Date(subscription.created_at).toLocaleDateString()}</span>
                </div>
                {subscription.notes && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{t("subscriptions.notes")}:</div>
                    <p className="text-sm">{subscription.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('subscriptions.nextRenewal')}:</span>
                <span className="font-medium">
                  {subscription?.next_renewal_date ? format(new Date(subscription.next_renewal_date), 'PPP') : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('subscriptions.contributors')}:</span>
                <span className="font-medium">{contributors.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('subscriptions.reminders')}:</span>
                <span className="font-medium">
                  {subscription?.notifications_enabled ? t('common.enabled') : t('common.disabled')}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contributors" className="space-y-3 mt-4">
            {contributors.map((contributor) => {
              const profile = (contributor as any).profiles;
              const isCurrentUser = currentUser?.id === contributor.user_id;
              const isOwnerContribution = contributor.user_id === subscription?.user_id;
              
              const getStatusBadge = () => {
                if (contributor.is_settled) {
                  return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />{t('subscriptions.statusPaid')}</Badge>;
                } else if (contributor.payment_submitted) {
                  return <Badge variant="secondary" className="bg-warning/20 text-warning"><Clock className="h-3 w-3 mr-1" />{t('subscriptions.statusAwaitingApproval')}</Badge>;
                } else if (isOwnerContribution && isOwner) {
                  return <Badge variant="outline">{t('subscriptions.statusYourContribution')}</Badge>;
                } else {
                  return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{t('subscriptions.statusPending')}</Badge>;
                }
              };

              return (
              <div key={contributor.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {profile?.full_name || t('common.unknown')}
                        {isCurrentUser && ' (You)'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(Number(contributor.contribution_amount), subscription?.currency || 'SAR', i18n.language)}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge()}
                </div>

                <div className="flex gap-2">
                  {/* Current user can settle/mark payment */}
                  {isCurrentUser && !contributor.is_settled && !contributor.payment_submitted && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (isOwner && isOwnerContribution) {
                          markAsPaid.mutate(contributor.id);
                        } else {
                          submitPayment.mutate(contributor.id);
                        }
                      }}
                      disabled={submitPayment.isPending || markAsPaid.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {isOwner && isOwnerContribution 
                        ? t('subscriptions.markAsPaid')
                        : t('subscriptions.settlePayment')}
                    </Button>
                  )}

                  {/* Owner can approve/reject submitted payments from others */}
                  {isOwner && !isCurrentUser && contributor.payment_submitted && !contributor.is_settled && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => approvePayment.mutate(contributor.id)}
                        disabled={approvePayment.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('subscriptions.approve')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectPayment.mutate(contributor.id)}
                        disabled={rejectPayment.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('subscriptions.reject')}
                      </Button>
                    </>
                  )}

                  {/* Owner can send reminders to all pending contributors */}
                  {isOwner && !isCurrentUser && !contributor.is_settled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminder.mutate(contributor.id)}
                      disabled={sendReminder.isPending}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      {t('subscriptions.sendReminder')}
                    </Button>
                  )}
                </div>

                {contributor.paid_at && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('subscriptions.paidOn')} {format(new Date(contributor.paid_at), 'PPP')}
                  </div>
                )}
              </div>
            );
            })}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="text-center text-muted-foreground py-8">
              {t('subscriptions.paymentHistoryComingSoon')}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};