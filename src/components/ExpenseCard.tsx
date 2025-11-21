import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';
import { useIsRTL } from '@/lib/rtl-utils';
import { formatCurrency } from '@/lib/formatters';
import { responsiveText, responsiveSize } from '@/lib/responsive-utils';

type ExpenseWithDetails = Tables<'expenses'> & {
  member_count?: number;
  total_owed?: number;
  total_received?: number;
  settled_count?: number;
  is_creator?: boolean;
};

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onViewDetails?: (id: string) => void;
  onAddExpense?: (id: string) => void;
}

const ExpenseCard = memo(({ expense, onViewDetails, onAddExpense }: ExpenseCardProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  // Memoize expensive calculations
  const { totalOwed, totalReceived, netBalance, allSettled } = useMemo(() => ({
    totalOwed: expense.total_owed || 0,
    totalReceived: expense.total_received || 0,
    netBalance: (expense.total_received || 0) - (expense.total_owed || 0),
    allSettled: expense.settled_count === expense.member_count
  }), [expense.total_owed, expense.total_received, expense.settled_count, expense.member_count]);

  return (
    <Card className="border border-border hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className={`${responsiveText.cardTitle} font-semibold truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                {expense.name}
              </CardTitle>
              <p className={`${responsiveText.caption} text-muted-foreground mt-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('components.expenseCard.total')}: {formatCurrency(Number(expense.total_amount || 0))}
              </p>
            </div>
          </div>
          <Badge variant={allSettled ? "default" : "secondary"} className="text-xs shrink-0">
            {allSettled ? t('components.expenseCard.settled') : t('components.expenseCard.active')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="p-2.5 md:p-3 rounded-lg bg-accent border border-border">
            <div className={`flex items-center gap-1.5 ${responsiveText.caption} text-muted-foreground mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">{t('components.expenseCard.members')}</span>
            </div>
            <div className={`${responsiveText.body} font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
              {expense.member_count || 0}
            </div>
          </div>
          
          <div className="p-2.5 md:p-3 rounded-lg bg-accent border border-border">
            <div className={`flex items-center gap-1.5 ${responsiveText.caption} text-muted-foreground mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">{t('components.expenseCard.created')}</span>
            </div>
            <div className={`${responsiveText.caption} md:text-sm font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
              {new Date(expense.created_at).toLocaleDateString(undefined, { calendar: 'gregory' })}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`p-3 md:p-4 rounded-lg border ${
          netBalance > 0 
            ? 'bg-success/10 border-success/30' 
            : netBalance < 0
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-accent border-border'
        }`}>
          <div className={`flex items-center gap-1.5 ${responsiveText.caption} font-medium mb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span>{t('components.expenseCard.yourBalance')}</span>
          </div>
          <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`text-lg md:text-xl font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
              {netBalance > 0 && '+'}
              {formatCurrency(Math.abs(netBalance))}
            </div>
            <div className={`${responsiveText.caption} text-muted-foreground ${isRTL ? 'text-left' : 'text-right'} whitespace-nowrap`}>
              {netBalance > 0 ? t('components.expenseCard.youReceive') : netBalance < 0 ? t('components.expenseCard.youOwe') : t('components.expenseCard.settled')}
            </div>
          </div>
        </div>

        {/* Settlement progress */}
        {!allSettled && (
          <div>
            <div className={`flex justify-between ${responsiveText.caption} text-muted-foreground mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('components.expenseCard.settlement')}</span>
              <span className="font-medium">{expense.settled_count || 0} / {expense.member_count || 0}</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div 
                className={`h-full bg-primary transition-all duration-500 ${isRTL ? 'ml-auto' : ''}`}
                style={{ 
                  width: `${((expense.settled_count || 0) / (expense.member_count || 1)) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={`flex gap-1.5 md:gap-2 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            onClick={() => onViewDetails?.(expense.id)}
            className="flex-1 min-w-0 h-8 md:h-10 px-1.5 md:px-4 text-[10px] md:text-sm"
            size="sm"
          >
            <span className="truncate">{t('components.expenseCard.viewDetails')}</span>
          </Button>
          {expense.is_creator && (
            <Button
              onClick={() => onAddExpense?.(expense.id)}
              variant="outline"
              size="sm"
              className="flex-1 min-w-0 h-8 md:h-10 px-1.5 md:px-4 text-[10px] md:text-sm"
            >
              <span className="truncate">{t('components.expenseCard.add')}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

export default ExpenseCard;
