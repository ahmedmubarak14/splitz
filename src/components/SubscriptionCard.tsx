import { CreditCard, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { formatCurrency } from "@/lib/formatters";

interface SubscriptionCardProps {
  subscription: any;
}

export const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const daysUntilRenewal = differenceInDays(
    new Date(subscription.next_renewal_date),
    new Date()
  );

  const renewalStatus = daysUntilRenewal < 0 
    ? "overdue" 
    : daysUntilRenewal <= 3 
    ? "due-soon" 
    : "upcoming";

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
            <p className="text-xs text-muted-foreground mb-1">
              {subscription.subscription_contributors.length} {t('subscriptions.contributors')}
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full">
          {t('subscriptions.markAsPaid')}
        </Button>
      </CardContent>
    </Card>
  );
};