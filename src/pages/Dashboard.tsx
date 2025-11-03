import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { SEO, pageSEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing, responsiveGrid } from '@/lib/responsive-utils';
import { formatCurrency } from '@/lib/formatters';
import Navigation from '@/components/Navigation';
import { TodaysTasksWidget } from '@/components/dashboard/TodaysTasksWidget';
import { UpcomingSubscriptionsWidget } from '@/components/dashboard/UpcomingSubscriptionsWidget';
import { PendingExpensesWidget } from '@/components/dashboard/PendingExpensesWidget';
import { HabitsDueTodayWidget } from '@/components/dashboard/HabitsDueTodayWidget';
import { QuickActionsHub } from '@/components/dashboard/QuickActionsHub';
import { StreakDisplay } from '@/components/StreakDisplay';
import { DailyActionItems } from '@/components/dashboard/DailyActionItems';
import { PersonalizedInsights } from '@/components/dashboard/PersonalizedInsights';
import { LeaderboardWidget } from '@/components/dashboard/LeaderboardWidget';
import { FriendActivityWidget } from '@/components/dashboard/FriendActivityWidget';
import { addDays } from 'date-fns';
import { prefetchTasks, prefetchHabits, prefetchExpenses, prefetchFocus } from '@/App';

// Memoized stat card component
const StatCard = memo(({ stat, isRTL }: { stat: any; isRTL: boolean }) => (
  <Card className="bg-background border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
    <CardContent className="p-4 md:p-5">
      <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1">
          <p className={`text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {stat.label}
          </p>
        </div>
        <div className="inline-flex p-2.5 rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
          <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
        </div>
      </div>
      <div className="space-y-1">
        <div className={`text-2xl md:text-3xl font-bold text-foreground tracking-tight ${isRTL ? 'text-right' : 'text-left'}`}>
          {stat.value}
        </div>
        <p className={`text-xs text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
          {stat.subtitle}
        </p>
      </div>
    </CardContent>
  </Card>
));

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
    // Prefetch commonly accessed pages from Dashboard
    prefetchTasks();
    prefetchHabits();
    prefetchExpenses();
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

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const today = new Date().toISOString().split('T')[0];

      // Batch all queries together for better performance
      const [
        habitsResult,
        createdChallengesResult,
        participantChallengesResult,
        focusSessionsResult,
        netBalancesOwedResult,
        groupMembershipsResult,
        createdGroupsResult,
        tasksResult,
        subscriptionsResult,
        allNetBalancesResult,
        todayCheckInsResult
      ] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('challenges').select('*').eq('creator_id', user.id).gte('end_date', today),
        supabase.from('challenge_participants').select('challenge_id').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).not('end_time', 'is', null).eq('tree_survived', true),
        supabase.from('net_balances').select('*').eq('from_user_id', user.id),
        supabase.from('expense_group_members').select('group_id').eq('user_id', user.id),
        supabase.from('expense_groups').select('id').eq('created_by', user.id),
        supabase.from('focus_tasks').select('*').eq('user_id', user.id).or(`due_date.lte.${today},due_date.is.null`).eq('is_completed', false).order('due_date', { ascending: true }),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').gte('next_renewal_date', today).lte('next_renewal_date', addDays(new Date(), 7).toISOString().split('T')[0]).order('next_renewal_date', { ascending: true }),
        supabase.from('net_balances').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`),
        supabase.from('habit_check_ins').select('habit_id').eq('user_id', user.id).gte('checked_in_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);

      const habits = habitsResult.data;
      const createdChallenges = createdChallengesResult.data;
      const participantChallenges = participantChallengesResult.data;
      const focusSessions = focusSessionsResult.data;
      const netBalancesOwed = netBalancesOwedResult.data;
      const groupMemberships = groupMembershipsResult.data;
      const createdGroups = createdGroupsResult.data;
      const tasks = tasksResult.data;
      const subscriptions = subscriptionsResult.data;
      const allNetBalances = allNetBalancesResult.data;
      const todayCheckIns = todayCheckInsResult.data;

      // Process participant challenges
      const participantChallengeIds = participantChallenges?.map(p => p.challenge_id) || [];
      let joinedChallenges: any[] = [];
      if (participantChallengeIds.length > 0) {
        const { data } = await supabase
          .from('challenges')
          .select('*')
          .in('id', participantChallengeIds)
          .gte('end_date', today);
        joinedChallenges = data || [];
      }

      const challenges = [...(createdChallenges || []), ...joinedChallenges];

      // Calculate focus minutes
      const totalFocusMinutes = focusSessions?.reduce((sum, session) => 
        sum + (session.duration_minutes || 0), 0) || 0;

      // Process expense groups
      const allGroupIds = [
        ...(groupMemberships?.map(m => m.group_id) || []),
        ...(createdGroups?.map(g => g.id) || [])
      ];
      const uniqueGroupIds = [...new Set(allGroupIds)];

      // Fetch expense groups with balances
      const { data: expenseGroups } = await supabase
        .from('expense_groups')
        .select('*')
        .in('id', uniqueGroupIds)
        .order('created_at', { ascending: false })
        .limit(3);

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

        const { count: memberCount } = await supabase
          .from('expense_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          ...group,
          userBalance,
          memberCount: (memberCount || 0) + 1
        };
      }));

      // Calculate stats
      const longestStreak = habits?.reduce((max, habit) => 
        Math.max(max, habit.streak_count || 0), 0) || 0;

      const totalOwed = netBalancesOwed?.reduce((sum, balance) => 
        sum + parseFloat(String(balance.amount || 0)), 0) || 0;

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

      // Process habit check-ins
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
  }, [t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent shadow-lg"></div>
          <p className="text-sm text-muted-foreground animate-pulse">{t('dashboard.loadingMessage')}</p>
        </div>
      </div>
    );
  }

  // Memoize stat cards to prevent recreating on every render
  const statCards = useMemo(() => [
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
  ], [stats, t]);
  
  // Memoize filtered habits to avoid recalculation
  const habitsCompleted = useMemo(() => 
    habitsData.filter(h => h.hasCheckedInToday).length, 
    [habitsData]
  );
  
  const habitsDue = useMemo(() => 
    habitsData.filter(h => !h.hasCheckedInToday).length, 
    [habitsData]
  );

  return (
    <>
      <SEO {...pageSEO.dashboard} />
      <div className={`min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background overflow-x-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`max-w-[1400px] mx-auto ${responsiveSpacing.pageContainer} ${responsiveSpacing.sectionGap} pb-20 md:pb-6`}>
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('dashboard.subtitle')}</p>
        </div>

        {/* Widget Grid - 2 Column Layout */}
        <div className={`grid ${responsiveGrid.twoColumn} gap-4 md:gap-6`}>
          <div className="col-span-full">
            <StreakDisplay />
          </div>
          
          {/* Personalized Insights & Action Items */}
          <PersonalizedInsights
            longestStreak={stats.longestStreak}
            focusMinutes={stats.focusMinutes}
            habitsCompleted={habitsCompleted}
            weeklyGoal={7}
          />
          <DailyActionItems
            habitsDue={habitsDue}
            tasksDue={todaysTasks.length}
            expensesPending={stats.pendingExpenses}
            challengesActive={stats.activeChallenges}
          />
          
          <TodaysTasksWidget tasks={todaysTasks} onRefresh={fetchDashboardData} />
          <HabitsDueTodayWidget habits={habitsData} onRefresh={fetchDashboardData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaderboardWidget />
          <FriendActivityWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingSubscriptionsWidget subscriptions={upcomingSubscriptions} />
          <PendingExpensesWidget balances={netBalances} userId={userId} />
        </div>

        {/* Quick Actions Hub */}
        <QuickActionsHub focusMinutesThisWeek={stats.focusMinutes} />

        {/* Stats Grid */}
        <div className={`grid ${responsiveGrid.stats} ${responsiveSpacing.gridGap}`}>
          {statCards.map((stat, idx) => (
            <StatCard key={idx} stat={stat} isRTL={isRTL} />
          ))}
        </div>
      </div>
      <Navigation />
      </div>
    </>
  );
}
