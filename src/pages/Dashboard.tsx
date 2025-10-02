import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Trophy, DollarSign, Plus, Flame, AlertCircle, CheckCircle2 } from 'lucide-react';
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

      // Fetch habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      // Fetch challenges
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .or(`creator_id.eq.${user.id},challenge_participants.user_id.eq.${user.id}`)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      // Fetch expenses
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

  const quickActions = [
    {
      title: 'New Habit',
      icon: Target,
      action: () => navigate('/habits'),
      gradient: 'from-primary to-secondary',
    },
    {
      title: 'New Challenge',
      icon: Trophy,
      action: () => navigate('/challenges'),
      gradient: 'from-secondary to-accent',
    },
    {
      title: 'Split Expense',
      icon: DollarSign,
      action: () => navigate('/expenses'),
      gradient: 'from-accent to-primary',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-3">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-3xl border-2 shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Habits
              </CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeHabits}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Longest Streak
              </CardTitle>
              <Flame className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.longestStreak} days</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Challenges
              </CardTitle>
              <Trophy className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeChallenges}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 shadow-card card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Expenses
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.pendingExpenses}</div>
              {stats.totalOwed > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  SAR {stats.totalOwed.toFixed(2)} owed
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                onClick={action.action}
                className={`h-24 bg-gradient-to-br ${action.gradient} hover:opacity-90 transition-opacity`}
                size="lg"
              >
                <action.icon className="h-6 w-6 mr-3" />
                <span className="text-lg font-semibold">{action.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Pending Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                Pending Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.activeHabits > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You have {stats.activeHabits} active habits to check in today
                  </p>
                  <Button onClick={() => navigate('/habits')} variant="outline" className="w-full">
                    View Habits
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Settlements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pending Settlements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingExpenses > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingExpenses} expense{stats.pendingExpenses > 1 ? 's' : ''} awaiting settlement
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Total: SAR {stats.totalOwed.toFixed(2)}
                  </p>
                  <Button onClick={() => navigate('/expenses')} variant="outline" className="w-full">
                    View Expenses
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted mx-auto mb-2" />
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
