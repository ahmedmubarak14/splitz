import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { Button } from "./ui/button";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface RenewalCalendarProps {
  subscriptions: any[];
  onSelectSubscription?: (subscription: any) => void;
}

export const RenewalCalendar = ({ subscriptions, onSelectSubscription }: RenewalCalendarProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group subscriptions by renewal date
  const subscriptionsByDate = subscriptions.reduce((acc: Record<string, any[]>, sub) => {
    if (sub.next_renewal_date) {
      const dateKey = format(new Date(sub.next_renewal_date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(sub);
    }
    return acc;
  }, {});

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const weekDays = [
    t('subscriptions.sun'),
    t('subscriptions.mon'),
    t('subscriptions.tue'),
    t('subscriptions.wed'),
    t('subscriptions.thu'),
    t('subscriptions.fri'),
    t('subscriptions.sat'),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <CalendarIcon className="h-5 w-5" />
            {t('subscriptions.renewalCalendar')}
          </CardTitle>
          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              {t('subscriptions.previous')}
            </Button>
            <span className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              {t('subscriptions.next')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySubscriptions = subscriptionsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const hasRenewals = daySubscriptions.length > 0;

            return (
              <div
                key={dateKey}
                className={`
                  aspect-square border rounded-lg p-1 text-sm
                  ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
                  ${hasRenewals ? 'cursor-pointer hover:bg-accent' : ''}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                `}
                onClick={() => hasRenewals && onSelectSubscription?.(daySubscriptions[0])}
              >
                <div className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                {hasRenewals && (
                  <div className="mt-1 space-y-0.5">
                    {daySubscriptions.slice(0, 2).map(sub => (
                      <div
                        key={sub.id}
                        className="text-[10px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate"
                        title={`${sub.name}: ${formatCurrency(Number(sub.amount), sub.currency, i18n.language)}`}
                      >
                        {sub.name}
                      </div>
                    ))}
                    {daySubscriptions.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{daySubscriptions.length - 2} {t('subscriptions.more')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={`mt-4 flex items-center gap-4 text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className="w-3 h-3 rounded bg-primary/10 border border-primary" />
            <span className="text-muted-foreground">{t('subscriptions.hasRenewals')}</span>
          </div>
          <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
            <div className="w-3 h-3 rounded border-2 border-primary" />
            <span className="text-muted-foreground">{t('subscriptions.today')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
