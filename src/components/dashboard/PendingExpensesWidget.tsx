import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { useIsRTL } from '@/lib/rtl-utils';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

interface NetBalance {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  from_user_name: string;
  to_user_name: string;
}

interface PendingExpensesWidgetProps {
  balances: NetBalance[];
  userId: string;
}

export function PendingExpensesWidget({ balances, userId }: PendingExpensesWidgetProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();

  const youOwe = balances.filter(b => b.from_user_id === userId).slice(0, 3);
  const owesYou = balances.filter(b => b.to_user_id === userId).slice(0, 3);

  const totalOwed = youOwe.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0);
  const totalOwing = owesYou.reduce((sum, b) => sum + parseFloat(String(b.amount)), 0);

  return (
    <DashboardWidgetCard 
      title={t('dashboard.pendingExpenses') || "Pending Expenses"}
      icon={DollarSign}
      badge={balances.length}
    >
      <div className="space-y-3">
        {/* Net Balance Summary */}
        {(totalOwed > 0 || totalOwing > 0) && (
          <div className={`p-3 rounded-lg border transition-all duration-200 ${totalOwing - totalOwed >= 0 ? 'bg-success/10 border-success/30 shadow-sm' : 'bg-destructive/10 border-destructive/30 shadow-sm'}`}>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('dashboard.netBalance') || 'Net Balance'}
              </span>
              <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {totalOwing - totalOwed >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-base font-bold ${totalOwing - totalOwed >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalOwing - totalOwed >= 0 ? '+' : ''}{formatCurrency(totalOwing - totalOwed, 'SAR', i18n.language)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* You Owe */}
        {youOwe.length > 0 && (
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t('dashboard.youOwe') || 'You Owe'}
            </p>
            <div className="space-y-2">
              {youOwe.map((balance) => (
                <div 
                  key={balance.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors"
                >
                  <span className="text-sm font-medium">{balance.to_user_name}</span>
                  <span className="text-sm font-bold text-destructive">
                    {formatCurrency(balance.amount, 'SAR', i18n.language)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owes You */}
        {owesYou.length > 0 && (
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t('dashboard.owesYou') || 'Owes You'}
            </p>
            <div className="space-y-2">
              {owesYou.map((balance) => (
                <div 
                  key={balance.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20 hover:bg-success/10 transition-colors"
                >
                  <span className="text-sm font-medium">{balance.from_user_name}</span>
                  <span className="text-sm font-bold text-success">
                    +{formatCurrency(balance.amount, 'SAR', i18n.language)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {balances.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-success mb-2">
              {t('dashboard.noExpenses') || "All settled up! 💰"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No pending expenses or balances
            </p>
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/expenses')}
          className={`w-full hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {t('dashboard.viewExpenses') || 'View Expenses'}
          <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
        </Button>
      </div>
    </DashboardWidgetCard>
  );
}
