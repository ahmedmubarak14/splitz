import { useEffect, useState } from 'react';
import { SEO, pageSEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  ShoppingCart,
  Eye,
  MessageSquare,
  AlertTriangle,
  Plus,
  Users,
  ArrowRight,
  Brain,
  Trees,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing, responsiveGrid } from '@/lib/responsive-utils';
import { formatCurrency } from '@/lib/formatters';
import { HabitStatistics } from '@/components/HabitStatistics';
import { ChallengeProgressChart } from '@/components/ChallengeProgressChart';
import { ExpenseAnalytics } from '@/components/ExpenseAnalytics';
import Navigation from '@/components/Navigation';
import { TodaysTasksWidget } from '@/components/dashboard/TodaysTasksWidget';
import { UpcomingSubscriptionsWidget } from '@/components/dashboard/UpcomingSubscriptionsWidget';
import { PendingExpensesWidget } from '@/components/dashboard/PendingExpensesWidget';
import { HabitsDueTodayWidget } from '@/components/dashboard/HabitsDueTodayWidget';
import { QuickActionsHub } from '@/components/dashboard/QuickActionsHub';
import { addDays } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeHabits: 0,
    longestStreak: 0,
    activeChallenges: 0,
    pendingExpenses: 0,
    totalOwed: 0,
    totalExpenseGroups: 0,
    focusSessions: 0,
    focusMinutes: 0,
  });
  const [recentExpenseGroups, setRecentExpenseGroups] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<any[]>([]);
  const [netBalances, setNetBalances] = useState<any[]>([]);
  const [habitsData, setHabitsData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    
    // Check if onboarding is completed
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile && !profile.onboarding_completed) {
        navigate('/onboarding');
        return;
      }
    }
    
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      // Fetch challenges where user is creator
      const { data: createdChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', user.id)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      // Fetch challenges where user is participant
      const { data: participantChallenges } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id);

      const participantChallengeIds = participantChallenges?.map(p => p.challenge_id) || [];
      
      let joinedChallenges: any[] = [];
      if (participantChallengeIds.length > 0) {
        const { data } = await supabase
          .from('challenges')
          .select('*')
          .in('id', participantChallengeIds)
          .gte('end_date', new Date().toISOString().split('T')[0]);
        joinedChallenges = data || [];
      }

      const challenges = [...(createdChallenges || []), ...joinedChallenges];

      // Fetch focus sessions (only completed ones with end_time)
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .not('end_time', 'is', null)
        .eq('tree_survived', true);

      const totalFocusMinutes = focusSessions?.reduce((sum, session) => 
        sum + (session.duration_minutes || 0), 0) || 0;

      // Fetch net balances where user owes money (from_user_id = user.id)
      const { data: netBalancesOwed } = await supabase
        .from('net_balances')
        .select('*')
        .eq('from_user_id', user.id);

      // Fetch expense groups
      const { data: groupMemberships } = await supabase
        .from('expense_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const { data: createdGroups } = await supabase
        .from('expense_groups')
        .select('id')
        .eq('created_by', user.id);

      const allGroupIds = [
        ...(groupMemberships?.map(m => m.group_id) || []),
        ...(createdGroups?.map(g => g.id) || [])
      ];
      const uniqueGroupIds = [...new Set(allGroupIds)];

      // Fetch recent expense groups with details
      const { data: expenseGroups } = await supabase
        .from('expense_groups')
        .select('*')
        .in('id', uniqueGroupIds)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get net balances for each group
      const groupsWithBalances = await Promise.all((expenseGroups || []).map(async (group) => {
        const { data: netBalances } = await supabase
          .from('net_balances')
          .select('*')
          .eq('group_id', group.id)
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

        const userBalance = netBalances?.reduce((sum, nb) => {
          if (nb.from_user_id === user.id) {
            return sum - parseFloat(String(nb.amount || 0));
          } else if (nb.to_user_id === user.id) {
            return sum + parseFloat(String(nb.amount || 0));
          }
          return sum;
        }, 0) || 0;

        // Count members
        const { count: memberCount } = await supabase
          .from('expense_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          ...group,
          userBalance,
          memberCount: (memberCount || 0) + 1 // +1 for creator
        };
      }));

      const longestStreak = habits?.reduce((max, habit) => 
        Math.max(max, habit.streak_count || 0), 0) || 0;

      const totalOwed = netBalancesOwed?.reduce((sum, balance) => 
        sum + parseFloat(String(balance.amount || 0)), 0) || 0;

      // Fetch today's tasks (due today or overdue)
      const today = new Date().toISOString().split('T')[0];
      const { data: tasks } = await supabase
        .from('focus_tasks')
        .select('*')
        .eq('user_id', user.id)
        .or(`due_date.lte.${today},due_date.is.null`)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      // Fetch subscriptions renewing in next 7 days
      const sevenDaysFromNow = addDays(new Date(), 7).toISOString().split('T')[0];
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('next_renewal_date', today)
        .lte('next_renewal_date', sevenDaysFromNow)
        .order('next_renewal_date', { ascending: true });

      // Fetch net balances with user profiles
      const { data: allNetBalances } = await supabase
        .from('net_balances')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

      // Fetch profiles for net balances
      const balancesWithNames = await Promise.all((allNetBalances || []).map(async (balance) => {
        const { data: fromUser } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', balance.from_user_id)
          .single();
        
        const { data: toUser } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', balance.to_user_id)
          .single();

        return {
          ...balance,
          from_user_name: fromUser?.full_name || 'Unknown',
          to_user_name: toUser?.full_name || 'Unknown'
        };
      }));

      // Check today's habit check-ins
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayCheckIns } = await supabase
        .from('habit_check_ins')
        .select('habit_id')
        .eq('user_id', user.id)
        .gte('checked_in_at', todayStart.toISOString());

      const checkedInHabitIds = new Set(todayCheckIns?.map(ci => ci.habit_id) || []);
      
      const habitsWithCheckIns = habits?.map(habit => ({
        ...habit,
        hasCheckedInToday: checkedInHabitIds.has(habit.id)
      })) || [];

      setStats({
        activeHabits: habits?.length || 0,
        longestStreak,
        activeChallenges: challenges?.length || 0,
        pendingExpenses: netBalancesOwed?.length || 0,
        totalOwed,
        totalExpenseGroups: uniqueGroupIds.length,
        focusSessions: focusSessions?.length || 0,
        focusMinutes: totalFocusMinutes,
      });
      setRecentExpenseGroups(groupsWithBalances);
      setTodaysTasks(tasks || []);
      setUpcomingSubscriptions(subscriptions || []);
      setNetBalances(balancesWithNames);
      setHabitsData(habitsWithCheckIns);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { 
      label: t('dashboard.stats.totalHabits'),
      value: stats.activeHabits,
      subtitle: t('dashboard.stats.activeTracking'),
      icon: FileText,
      color: 'text-primary'
    },
    { 
      label: t('dashboard.stats.activeChallenges'),
      value: stats.activeChallenges,
      subtitle: t('dashboard.stats.inProgress'),
      icon: Clock,
      color: 'text-secondary'
    },
    { 
      label: t('dashboard.stats.longestStreak'),
      value: stats.longestStreak,
      subtitle: t('dashboard.stats.daysMaintained'),
      icon: CheckCircle,
      color: 'text-success'
    },
    { 
      label: t('dashboard.focusSessions'),
      value: stats.focusSessions,
      subtitle: t('dashboard.focusSessionsSubtitle', { count: stats.focusMinutes }),
      icon: Brain,
      color: 'text-purple-600'
    },
  ];

  return (
    <>
      <SEO {...pageSEO.dashboard} />
      <div className={`min-h-screen bg-muted/20 ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding} overflow-x-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`max-w-[1400px] mx-auto px-4 sm:px-6 ${responsiveSpacing.sectionGap} max-w-full`}>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className={`${isRTL ? 'flex flex-row-reverse' : 'flex'} w-full`}>
              <TabsTrigger className="flex-1" value="overview">{t('dashboard.overview')}</TabsTrigger>
              <TabsTrigger className="flex-1" value="habits">{t('dashboard.habits')}</TabsTrigger>
              <TabsTrigger className="flex-1" value="focus">{t('dashboard.focus') || 'Focus'}</TabsTrigger>
              <TabsTrigger className="flex-1" value="expenses">{t('dashboard.expenses')}</TabsTrigger>
              <TabsTrigger className="flex-1" value="challenges">{t('dashboard.challenges')}</TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Widget Grid - 2 Column Layout */}
            <div className={`grid ${responsiveGrid.twoColumn} gap-6`}>
              <TodaysTasksWidget tasks={todaysTasks} onRefresh={fetchDashboardData} />
              <HabitsDueTodayWidget habits={habitsData} onRefresh={fetchDashboardData} />
              <UpcomingSubscriptionsWidget subscriptions={upcomingSubscriptions} />
              <PendingExpensesWidget balances={netBalances} userId={userId} />
            </div>

            {/* Quick Actions Hub */}
            <QuickActionsHub focusMinutesThisWeek={stats.focusMinutes} />

            {/* Stats Grid */}
            <div className={`grid ${responsiveGrid.stats} ${responsiveSpacing.gridGap}`}>
              {statCards.map((stat, idx) => (
                <Card key={idx} className="bg-background border border-border/40">
                  <CardContent className={responsiveSpacing.pageContainer}>
                    <div className={`flex items-start justify-between mb-3 md:mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <p className={`text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {stat.label}
                        </p>
                      </div>
                      <stat.icon className={`h-4 w-4 md:h-5 md:h-5 ${stat.color} ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className={`text-2xl md:text-3xl font-bold text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{stat.value}</div>
                      <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{stat.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Habits Analytics Tab */}
          <TabsContent value="habits"><HabitStatistics /></TabsContent>

          {/* Focus Tab */}
          <TabsContent value="focus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {t('dashboard.focusSessions') || 'Focus Sessions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{stats.focusSessions}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('focus.totalSessions') || 'Total Sessions'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{stats.focusMinutes}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('focus.minutesFocused') || 'Minutes'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
                    <div className="text-2xl font-bold">
                      {Math.floor(stats.focusMinutes / 60)}h {stats.focusMinutes % 60}m
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('focus.totalTime') || 'Total Time'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <Button onClick={() => navigate('/focus')} className="gap-2">
                    <Brain className="w-4 h-4" />
                    {t('dashboard.startFocus') || 'Start Focus Session'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses"><ExpenseAnalytics /></TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges"><ChallengeProgressChart /></TabsContent>
        </Tabs>
      </div>
      <Navigation />
      </div>
    </>
  );
}
