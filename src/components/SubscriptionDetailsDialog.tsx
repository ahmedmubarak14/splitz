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
import { Calendar, Users, Bell, CheckCircle, XCircle, Clock } from "lucide-react";
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

  // Fetch contributors
  const { data: contributors = [] } = useQuery({
    queryKey: ['subscription-contributors', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_contributors')
        .select(`
          *,
          profiles!subscription_contributors_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('subscription_id', subscriptionId);
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Toggle payment status
  const togglePayment = useMutation({
    mutationFn: async ({ contributorId, isSettled }: { contributorId: string; isSettled: boolean }) => {
      const { error } = await supabase
        .from('subscription_contributors')
        .update({
          is_settled: !isSettled,
          paid_at: !isSettled ? new Date().toISOString() : null
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
              return (
              <div key={contributor.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(Number(contributor.contribution_amount), subscription?.currency || 'SAR', i18n.language)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={contributor.is_settled ? "default" : "secondary"}>
                    {contributor.is_settled ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('subscriptions.paid')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('subscriptions.pending')}
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={contributor.is_settled ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => togglePayment.mutate({
                      contributorId: contributor.id,
                      isSettled: contributor.is_settled || false
                    })}
                  >
                    {contributor.is_settled ? t('subscriptions.markUnpaid') : t('subscriptions.markPaid')}
                  </Button>

                  {!contributor.is_settled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminder.mutate(contributor.id)}
                      disabled={sendReminder.isPending}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      {t('subscriptions.remind')}
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