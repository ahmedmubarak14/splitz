import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { useIsRTL } from '@/lib/rtl-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Expense {
  id: string;
  name: string;
  total_amount: number;
  created_at: string;
  category?: string;
  paid_by: string;
}

interface ExpenseAnalyticsProps {
  expenses: Expense[];
}

const COLORS = {
  food: 'hsl(var(--primary))',
  transport: 'hsl(var(--secondary))',
  entertainment: 'hsl(var(--accent))',
  utilities: 'hsl(var(--success))',
  other: 'hsl(var(--muted-foreground))',
};

export default function ExpenseAnalytics({ expenses }: ExpenseAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();

  // Calculate category totals
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(String(expense.total_amount));
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: t(`expenses.categories.${category}`),
    value: amount,
    category,
  }));

  const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-background border border-border/40">
      <CardHeader>
        <CardTitle className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('expenses.spendingAnalytics')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('expenses.noDataAvailable')}
          </div>
        ) : (
          <>
            <div className={`mb-4 p-3 bg-primary/10 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-sm text-muted-foreground">{t('expenses.totalSpending')}</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalSpending, 'SAR', i18n.language)}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS] || COLORS.other} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, 'SAR', i18n.language)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item) => {
                  const percentage = ((item.value / totalSpending) * 100).toFixed(1);
                  return (
                    <div
                      key={item.category}
                      className={`flex items-center justify-between p-2 rounded ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[item.category as keyof typeof COLORS] || COLORS.other }}
                        />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(item.value, 'SAR', i18n.language)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
