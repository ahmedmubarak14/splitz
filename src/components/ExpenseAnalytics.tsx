import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ExpenseAnalytics() {
  const [stats, setStats] = useState<{
    categoryData: Array<{ name: string; value: number }>;
    totalOwed: number;
    totalOwedToYou: number;
    monthlyTotal: number;
  }>({ categoryData: [], totalOwed: 0, totalOwedToYou: 0, monthlyTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: groupMemberships } = await supabase.from('expense_group_members').select('group_id').eq('user_id', user.id);
      const { data: createdGroups } = await supabase.from('expense_groups').select('id').eq('created_by', user.id);
      const allGroupIds = [...(groupMemberships?.map(m => m.group_id) || []), ...(createdGroups?.map(g => g.id) || [])];
      const uniqueGroupIds = [...new Set(allGroupIds)];

      if (uniqueGroupIds.length === 0) {
        setLoading(false);
        return;
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const { data: expenses } = await supabase.from('expenses').select('category, total_amount, created_at').in('group_id', uniqueGroupIds).gte('created_at', startOfMonth.toISOString());

      const categoryMap: Record<string, number> = {};
      expenses?.forEach(expense => {
        const category = expense.category || 'other';
        categoryMap[category] = (categoryMap[category] || 0) + parseFloat(String(expense.total_amount));
      });

      const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value * 100) / 100,
      }));

      const { data: owedBalances } = await supabase.from('net_balances').select('amount').eq('from_user_id', user.id);
      const { data: owedToYouBalances } = await supabase.from('net_balances').select('amount').eq('to_user_id', user.id);

      const totalOwed = owedBalances?.reduce((sum, b) => sum + parseFloat(String(b.amount || 0)), 0) || 0;
      const totalOwedToYou = owedToYouBalances?.reduce((sum, b) => sum + parseFloat(String(b.amount || 0)), 0) || 0;
      const monthlyTotal = expenses?.reduce((sum, e) => sum + parseFloat(String(e.total_amount || 0)), 0) || 0;

      setStats({ categoryData, totalOwed, totalOwedToYou, monthlyTotal });
    } catch (error) {
      console.error('Error fetching expense stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><CardContent className="p-6"><div className="animate-pulse h-40 bg-muted rounded"></div></CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">You Owe</span></div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalOwed, 'SAR', 'en')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Owed to You</span></div>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalOwedToYou, 'SAR', 'en')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><CreditCard className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">This Month</span></div>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyTotal, 'SAR', 'en')}</div>
          </CardContent>
        </Card>
      </div>
      {stats.categoryData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {stats.categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, 'SAR', 'en')} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
