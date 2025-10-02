import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Trophy, DollarSign, ArrowRight, Flame, TrendingUp } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 md:pb-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3 tracking-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Habits
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Target className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeHabits}</div>
              <p className="text-xs text-muted-foreground mt-1">Building consistency</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Longest Streak
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Flame className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.longestStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">Days in a row</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Challenges
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeChallenges}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Expenses
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.pendingExpenses}</div>
              {stats.totalOwed > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  SAR {stats.totalOwed.toFixed(2)} owed
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/habits')}
              className="h-auto py-6 px-6 justify-start bg-foreground text-background hover:bg-foreground/90 transition-smooth btn-press group"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">New Habit</div>
                    <div className="text-sm opacity-80">Track daily progress</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>

            <Button
              onClick={() => navigate('/challenges')}
              className="h-auto py-6 px-6 justify-start bg-foreground text-background hover:bg-foreground/90 transition-smooth btn-press group"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">New Challenge</div>
                    <div className="text-sm opacity-80">Compete with friends</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>

            <Button
              onClick={() => navigate('/expenses')}
              className="h-auto py-6 px-6 justify-start bg-foreground text-background hover:bg-foreground/90 transition-smooth btn-press group"
              size="lg"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">Split Expense</div>
                    <div className="text-sm opacity-80">Share costs fairly</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.activeHabits > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You have {stats.activeHabits} active habit{stats.activeHabits > 1 ? 's' : ''} to check in today
                  </p>
                  <Button 
                    onClick={() => navigate('/habits')} 
                    variant="outline" 
                    className="w-full border-border hover:bg-muted transition-smooth"
                  >
                    View Habits
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✓</div>
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-foreground" />
                Pending Settlements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingExpenses > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingExpenses} expense{stats.pendingExpenses > 1 ? 's' : ''} awaiting settlement
                  </p>
                  <div className="text-2xl font-bold text-foreground">
                    SAR {stats.totalOwed.toFixed(2)}
                  </div>
                  <Button 
                    onClick={() => navigate('/expenses')} 
                    variant="outline"
                    className="w-full border-border hover:bg-muted transition-smooth"
                  >
                    View Expenses
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✓</div>
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