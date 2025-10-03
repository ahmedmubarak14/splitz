import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Trophy, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeHabits: 0,
    longestStreak: 0,
    activeChallenges: 0,
    pendingExpenses: 0,
    totalOwed: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .or(`creator_id.eq.${user.id},challenge_participants.user_id.eq.${user.id}`)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      const { data: expenseMembers } = await supabase
        .from('expense_members')
        .select('*, expenses(*)')
        .eq('user_id', user.id)
        .eq('is_settled', false);

      const longestStreak = habits?.reduce((max, habit) => 
        Math.max(max, habit.streak_count || 0), 0) || 0;

      const totalOwed = expenseMembers?.reduce((sum, member) => 
        sum + parseFloat(String(member.amount_owed || 0)), 0) || 0;

      setStats({
        activeHabits: habits?.length || 0,
        longestStreak,
        activeChallenges: challenges?.length || 0,
        pendingExpenses: expenseMembers?.length || 0,
        totalOwed,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Habits
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground">{stats.activeHabits}</div>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Longest Streak
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground">{stats.longestStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">days</p>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Challenges
                </CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground">{stats.activeChallenges}</div>
            </CardContent>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending Expenses
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground">{stats.pendingExpenses}</div>
              {stats.totalOwed > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  SAR {stats.totalOwed.toFixed(2)} owed
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => navigate('/habits')}
              variant="outline"
              className="h-24 flex-col gap-2 hover:border-primary hover:bg-accent transition-colors"
            >
              <Target className="h-6 w-6 text-primary" />
              <span className="font-medium">New Habit</span>
            </Button>
            <Button
              onClick={() => navigate('/challenges')}
              variant="outline"
              className="h-24 flex-col gap-2 hover:border-primary hover:bg-accent transition-colors"
            >
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-medium">New Challenge</span>
            </Button>
            <Button
              onClick={() => navigate('/expenses')}
              variant="outline"
              className="h-24 flex-col gap-2 hover:border-primary hover:bg-accent transition-colors"
            >
              <DollarSign className="h-6 w-6 text-primary" />
              <span className="font-medium">Split Expense</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.activeHabits > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stats.activeHabits} active habit{stats.activeHabits > 1 ? 's' : ''} to check in
                  </p>
                  <Button onClick={() => navigate('/habits')} variant="outline" size="sm" className="w-full">
                    View Habits
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pending Settlements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingExpenses > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingExpenses} expense{stats.pendingExpenses > 1 ? 's' : ''} awaiting settlement
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    Total: SAR {stats.totalOwed.toFixed(2)}
                  </p>
                  <Button onClick={() => navigate('/expenses')} variant="outline" size="sm" className="w-full">
                    View Expenses
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All settled!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
