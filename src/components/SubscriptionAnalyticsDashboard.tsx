import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SubscriptionAnalyticsDashboardProps {
  subscriptions: any[];
  currency?: string;
}

export const SubscriptionAnalyticsDashboard = ({ subscriptions, currency = 'SAR' }: SubscriptionAnalyticsDashboardProps) => {
  const { t, i18n } = useTranslation();

  // Calculate monthly total
  const calculateMonthlyTotal = () => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        const amount = Number(sub.amount);
        switch (sub.billing_cycle) {
          case 'weekly': return total + (amount * 4.33);
          case 'monthly': return total + amount;
          case 'quarterly': return total + (amount / 3);
          case 'yearly': return total + (amount / 12);
          case 'custom': 
            const days = sub.custom_cycle_days || 30;
            return total + (amount * (30 / days));
          default: return total + amount;
        }
      }, 0);
  };

  // Calculate yearly total
  const yearlyTotal = calculateMonthlyTotal() * 12;

  // Category breakdown
  const categoryData = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((acc: any[], sub) => {
      const category = sub.category || 'other';
      const existing = acc.find(item => item.name === category);
      const monthlyAmount = Number(sub.amount);
      
      if (existing) {
        existing.value += monthlyAmount;
      } else {
        acc.push({ 
          name: t(`subscriptions.${category}`), 
          value: monthlyAmount 
        });
      }
      return acc;
    }, []);

  // Monthly spending trend (mock data - you can enhance this with historical data)
  const currentMonthlyTotal = calculateMonthlyTotal();
  const monthlyTrend = [
    { month: 'Jan', amount: currentMonthlyTotal * 0.9 },
    { month: 'Feb', amount: currentMonthlyTotal * 0.95 },
    { month: 'Mar', amount: currentMonthlyTotal },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8B5CF6', '#EC4899'];

  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const sharedCount = subscriptions.filter(s => s.is_shared && s.status === 'active').length;
  const trialCount = subscriptions.filter(s => s.trial_ends_at && new Date(s.trial_ends_at) > new Date()).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('subscriptions.monthlyTotal')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateMonthlyTotal(), currency, i18n.language)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(yearlyTotal, currency, i18n.language)}/year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('subscriptions.activeCount')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {sharedCount} {t('subscriptions.sharedWithMe').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('subscriptions.trials')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('subscriptions.trials').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('subscriptions.avgPerSub')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCount > 0 ? formatCurrency(calculateMonthlyTotal() / activeCount, currency, i18n.language) : formatCurrency(0, currency, i18n.language)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('subscriptions.monthly').toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
