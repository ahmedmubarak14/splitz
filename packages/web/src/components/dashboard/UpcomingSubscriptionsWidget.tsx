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
      title={t('dashboard.upcomingRenewals')}
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
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all duration-200 ${getUrgencyColor(daysUntil)} ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="text-sm font-semibold">{sub.name}</p>
                  <span className="text-base font-bold">
                    {formatCurrency(sub.amount, sub.currency, i18n.language)}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {daysUntil === 0 ? t('dashboard.today') :
                     daysUntil === 1 ? t('dashboard.tomorrow') :
                     `${t('dashboard.in')} ${daysUntil} ${t('dashboard.days')}`}
                  </span>
                </div>
              </div>
            );
          })}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/subscriptions')}
            className={`w-full mt-2 hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-2">
            {t('dashboard.noUpcomingRenewals')}
          </p>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {t('subscriptions.allUpToDate')}
          </p>
          <Button 
            size="sm" 
            onClick={() => navigate('/subscriptions')}
            className="shadow-sm hover:shadow-md transition-all"
          >
            {t('dashboard.manageSubscriptions')}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
