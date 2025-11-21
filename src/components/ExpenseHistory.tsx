import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { useIsRTL } from '@/lib/rtl-utils';
import { Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  name: string;
  total_amount: number;
  created_at: string;
  category?: string;
  paid_by: string;
  split_type?: string;
}

interface ExpenseHistoryProps {
  expenses: Expense[];
  groupId?: string;
}

export default function ExpenseHistory({ expenses, groupId }: ExpenseHistoryProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const filteredExpenses = expenses.filter(expense => {
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    
    if (timeFilter !== 'all') {
      const expenseDate = new Date(expense.created_at);
      const now = new Date();
      
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        if (expenseDate < weekAgo) return false;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        if (expenseDate < monthAgo) return false;
      } else if (timeFilter === 'year') {
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        if (expenseDate < yearAgo) return false;
      }
    }
    
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(String(exp.total_amount)), 0);

  return (
    <Card className="bg-background border border-border/40">
      <CardHeader>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className="text-lg">{t('expenses.history')}</CardTitle>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('expenses.allCategories')}</SelectItem>
                <SelectItem value="food">{t('expenses.categories.food')}</SelectItem>
                <SelectItem value="transport">{t('expenses.categories.transport')}</SelectItem>
                <SelectItem value="entertainment">{t('expenses.categories.entertainment')}</SelectItem>
                <SelectItem value="utilities">{t('expenses.categories.utilities')}</SelectItem>
                <SelectItem value="other">{t('expenses.categories.other')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('expenses.allTime')}</SelectItem>
                <SelectItem value="week">{t('expenses.lastWeek')}</SelectItem>
                <SelectItem value="month">{t('expenses.lastMonth')}</SelectItem>
                <SelectItem value="year">{t('expenses.lastYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`mb-4 p-3 bg-primary/10 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-muted-foreground">{t('expenses.totalFiltered')}</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalAmount, 'SAR', i18n.language)}
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('expenses.noExpensesFound')}
            </div>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className={`p-3 rounded-lg border border-border/40 bg-muted/20 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="font-semibold">{expense.name}</p>
                    <div className={`flex items-center gap-2 text-xs text-muted-foreground mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(expense.created_at), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{t(`expenses.categories.${expense.category}`)}</span>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <p className="font-bold text-lg">
                      {formatCurrency(expense.total_amount, 'SAR', i18n.language)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`expenses.splitTypes.${expense.split_type}`)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
