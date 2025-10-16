import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, ArrowRight, Clock } from 'lucide-react';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { useIsRTL } from '@/lib/rtl-utils';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { format, differenceInDays } from 'date-fns';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  next_renewal_date: string;
}

interface UpcomingSubscriptionsWidgetProps {
  subscriptions: Subscription[];
}

export function UpcomingSubscriptionsWidget({ subscriptions }: UpcomingSubscriptionsWidgetProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil <= 1) return 'text-destructive bg-destructive/10 border-destructive/30';
    if (daysUntil <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-primary bg-primary/10 border-primary/30';
  };

  return (
    <DashboardWidgetCard 
      title={t('dashboard.upcomingRenewals') || "Upcoming Renewals"}
      icon={CreditCard}
      badge={subscriptions.length}
    >
      {subscriptions.length > 0 ? (
        <div className="space-y-2">
          {subscriptions.map((sub) => {
            const daysUntil = differenceInDays(new Date(sub.next_renewal_date), new Date());
            
            return (
              <div
                key={sub.id}
                onClick={() => navigate('/subscriptions')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/40 ${getUrgencyColor(daysUntil)} ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm font-medium">{sub.name}</p>
                  <span className="text-sm font-semibold">
                    {formatCurrency(sub.amount, sub.currency, i18n.language)}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-3 w-3" />
                  <span>
                    {daysUntil === 0 ? t('dashboard.today') || 'Today' :
                     daysUntil === 1 ? t('dashboard.tomorrow') || 'Tomorrow' :
                     `${t('dashboard.in') || 'in'} ${daysUntil} ${t('dashboard.days') || 'days'}`}
                  </span>
                </div>
              </div>
            );
          })}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/subscriptions')}
            className={`w-full mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll') || 'View All'}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className={`text-center py-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-muted-foreground mb-2">
            {t('dashboard.noUpcomingRenewals') || "No renewals in the next 7 days"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/subscriptions')}
          >
            {t('dashboard.manageSubscriptions') || 'Manage Subscriptions'}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
