import { CreditCard, Calendar, Users, Edit, UserPlus, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatCurrency } from "@/lib/formatters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateNextRenewalDate, daysUntilRenewal } from "@/lib/renewalCalculations";
import { useMemo, useCallback } from "react";

interface SubscriptionCardProps {
  subscription: any;
  onEdit?: () => void;
  onManageContributors?: () => void;
  onViewDetails?: () => void;
}

export const SubscriptionCard = ({ subscription, onEdit, onManageContributors, onViewDetails }: SubscriptionCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();

  const daysLeft = useMemo(() => daysUntilRenewal(subscription.next_renewal_date), [subscription.next_renewal_date]);
  const isDueToday = daysLeft === 0;
  const isTrial = subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
  const trialDaysLeft = useMemo(() => isTrial ? daysUntilRenewal(subscription.trial_ends_at) : 0, [isTrial, subscription.trial_ends_at]);

  const renewalStatus = daysLeft < 0 
    ? "overdue" 
    : isDueToday
    ? "due-today"
    : daysLeft <= 3 
    ? "due-soon" 
    : "upcoming";

  // Calculate usage indicator (days since last used)
  const daysSinceLastUsed = subscription.last_used_at 
    ? differenceInDays(new Date(), new Date(subscription.last_used_at))
    : null;

  const markSubscriptionPaid = useMutation({
    mutationFn: async () => {
      // Record payment
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          amount: subscription.amount,
          notes: `Payment for ${subscription.billing_cycle} cycle`
        });
      
      if (paymentError) throw paymentError;

      // Calculate next renewal date
      const nextDate = calculateNextRenewalDate(
        subscription.next_renewal_date,
        subscription.billing_cycle,
        subscription.custom_cycle_days
      );

      // Update subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ next_renewal_date: nextDate.toISOString().split('T')[0] })
        .eq('id', subscription.id);
      
      if (updateError) throw updateError;

      // If shared, reset all contributors' payment status
      if (subscription.is_shared) {
        const { error: resetError } = await supabase
          .from('subscription_contributors')
          .update({
            is_settled: false,
            payment_submitted: false,
            paid_at: null,
            approved_at: null,
            submission_at: null
          })
          .eq('subscription_id', subscription.id);
        
        if (resetError) throw resetError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('subscriptions.paymentRecorded'));
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription deleted');
    },
  });

  const handleDelete = useCallback(() => {
    if (confirm(t('subscriptions.deleteConfirm'))) {
      deleteSubscription.mutate();
    }
  }, [deleteSubscription, t]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className={`flex items-start justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div className={`flex items-center gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className="h-12 w-12 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
              {subscription.logo_url ? (
                <img 
                  src={subscription.logo_url} 
                  alt={subscription.name} 
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <CreditCard className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{subscription.name}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`subscriptions.${subscription.category}`)}
              </p>
            </div>
          </div>
          {subscription.is_shared && (
            <Badge variant="secondary">
              <Users className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('subscriptions.sharedSubscription')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trial Badge */}
        {isTrial && (
          <Badge variant="default" className="bg-warning text-warning-foreground">
            {t('subscriptions.trial')}: {trialDaysLeft} {t('common.daysLeft', { count: trialDaysLeft })}
          </Badge>
        )}

        <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <span className="text-2xl font-bold">
            {formatCurrency(Number(subscription.amount), subscription.currency, i18n.language)}
          </span>
          <Badge variant="outline">{t(`subscriptions.${subscription.billing_cycle}`)}</Badge>
        </div>

        {/* Renewal Progress Bar */}
        {!isTrial && daysLeft >= 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('subscriptions.nextRenewal')}</span>
              <span>{daysLeft} {t('common.days')}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  daysLeft <= 3 ? 'bg-destructive' : 
                  daysLeft <= 7 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ 
                  width: `${Math.max(10, 100 - (daysLeft / 30 * 100))}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Usage Indicator */}
        {daysSinceLastUsed !== null && daysSinceLastUsed > 30 && (
          <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded-lg text-xs">
            <span className="text-warning">⚠️ {t('subscriptions.notUsed', { count: daysSinceLastUsed })}</span>
          </div>
        )}

        <div className={`flex items-center gap-2 text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <Calendar className="h-4 w-4 text-muted-foreground" />
          
          {isDueToday ? (
            <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <Badge variant="destructive" className="animate-pulse">
                {t('subscriptions.dueToday')} 🔔
              </Badge>
              <Button 
                size="sm" 
                onClick={() => markSubscriptionPaid.mutate()}
                disabled={markSubscriptionPaid.isPending}
              >
                {markSubscriptionPaid.isPending ? t('common.processing') : t('subscriptions.markAsPaid')}
              </Button>
            </div>
          ) : (
            <span className={
              renewalStatus === "overdue" 
                ? "text-destructive font-semibold" 
                : renewalStatus === "due-soon"
                ? "text-yellow-600 font-semibold"
                : "text-muted-foreground"
            }>
              {renewalStatus === "overdue" 
                ? `${Math.abs(daysLeft)} ${t('subscriptions.overdue')}`
                : `${t('subscriptions.renews')} ${daysLeft} ${t('common.days')}`
              }
            </span>
          )}
        </div>

        {subscription.is_shared && subscription.subscription_contributors && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {subscription.subscription_contributors.length} {t('subscriptions.contributors')}
              </p>
              <div className="flex gap-1">
                {subscription.subscription_contributors.slice(0, 3).map((c: any) => (
                  <Badge key={c.id} variant={c.is_settled ? "default" : "secondary"} className="text-xs">
                    {c.is_settled ? '✓' : '○'}
                  </Badge>
                ))}
              </div>
            </div>
            {onViewDetails && (
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs mt-1"
                onClick={onViewDetails}
              >
                {t('subscriptions.viewDetails')}
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.edit')}
          </Button>

          {subscription.is_shared && onManageContributors && (
            <Button variant="outline" size="sm" onClick={onManageContributors} className="flex-1">
              <UserPlus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('subscriptions.contributors')}
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};