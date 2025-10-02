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
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8 animate-slide-up">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border shadow-md card-hover bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active Habits
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground tracking-tight">{stats.activeHabits}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-md card-hover bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Longest Streak
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Flame className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground tracking-tight">{stats.longestStreak}</div>
              <p className="text-sm text-muted-foreground mt-1">days</p>
            </CardContent>
          </Card>

          <Card className="border shadow-md card-hover bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active Challenges
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-secondary/10">
                <Trophy className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground tracking-tight">{stats.activeChallenges}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-md card-hover bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pending Expenses
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground tracking-tight">{stats.pendingExpenses}</div>
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
          <h2 className="text-2xl font-bold text-foreground mb-5 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/habits')}
              variant="gradient"
              size="lg"
              className="h-20 text-base"
            >
              <Target className="h-6 w-6" />
              <span>New Habit</span>
            </Button>
            <Button
              onClick={() => navigate('/challenges')}
              variant="secondary"
              size="lg"
              className="h-20 text-base"
            >
              <Trophy className="h-6 w-6" />
              <span>New Challenge</span>
            </Button>
            <Button
              onClick={() => navigate('/expenses')}
              variant="success"
              size="lg"
              className="h-20 text-base"
            >
              <DollarSign className="h-6 w-6" />
              <span>Split Expense</span>
            </Button>
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
