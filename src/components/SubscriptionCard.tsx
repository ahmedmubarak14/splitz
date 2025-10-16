import { CreditCard, Calendar, Users, Edit, UserPlus, Trash2 } from "lucide-react";
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

  const daysUntilRenewal = differenceInDays(
    new Date(subscription.next_renewal_date),
    new Date()
  );

  const renewalStatus = daysUntilRenewal < 0 
    ? "overdue" 
    : daysUntilRenewal <= 3 
    ? "due-soon" 
    : "upcoming";

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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription.mutate();
    }
  };

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
        <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <span className="text-2xl font-bold">
            {formatCurrency(Number(subscription.amount), subscription.currency, i18n.language)}
          </span>
          <Badge variant="outline">{t(`subscriptions.${subscription.billing_cycle}`)}</Badge>
        </div>

        <div className={`flex items-center gap-2 text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={
            renewalStatus === "overdue" 
              ? "text-destructive font-semibold" 
              : renewalStatus === "due-soon"
              ? "text-yellow-600 font-semibold"
              : "text-muted-foreground"
          }>
            {renewalStatus === "overdue" 
              ? `${Math.abs(daysUntilRenewal)} ${t('subscriptions.overdue')}`
              : `${t('subscriptions.renews')} ${daysUntilRenewal} ${t('subscriptions.days')}`
            }
          </span>
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
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          {subscription.is_shared && onManageContributors && (
            <Button variant="outline" size="sm" onClick={onManageContributors} className="flex-1">
              <UserPlus className="w-4 h-4 mr-2" />
              Contributors
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