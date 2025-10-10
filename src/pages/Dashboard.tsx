import { useEffect, useState } from 'react';
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      label: 'Focus Sessions',
      value: stats.focusSessions,
      subtitle: `${stats.focusMinutes} minutes focused`,
      icon: Brain,
      color: 'text-purple-600'
    },
  ];

  return (
    <div className={`min-h-screen bg-muted/20 ${responsiveSpacing.pageContainer} ${responsiveSpacing.mobileNavPadding}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`max-w-[1400px] mx-auto ${responsiveSpacing.sectionGap}`}>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and insights</p>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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

            {/* Two Column Layout */}
            <div className={`grid ${responsiveGrid.twoColumn} gap-6`}>
              <Card className="bg-background border border-border/40">
                <CardContent className="p-6">
                  <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h3 className={`text-base font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.actionRequired')}</h3>
                  </div>
                  {stats.pendingExpenses > 0 ? (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="text-sm font-medium text-foreground">{t('dashboard.pendingExpenses')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stats.pendingExpenses} {t('dashboard.expensesAwaiting')}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')} className="text-xs">{t('dashboard.review')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-border/30 rounded-lg p-4">
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm font-medium text-foreground">{t('dashboard.allClear')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.noPendingActions')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-background border border-border/40">
                <CardContent className="p-6">
                  <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <h3 className={`text-base font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.quickActions')}</h3>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={() => navigate('/habits')} variant="default" className={`w-full h-auto py-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <div className="text-sm font-medium">{t('dashboard.createNewHabit')}</div>
                        <div className="text-xs opacity-90">{t('dashboard.startNewTracker')}</div>
                      </div>
                    </Button>
                    <button onClick={() => navigate('/focus')} className={`w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40 hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Start Focus Session</div>
                        <div className="text-xs text-muted-foreground">Pomodoro timer & task tracking</div>
                      </div>
                    </button>
                    <button onClick={() => navigate('/challenges')} className={`w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40 hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{t('dashboard.browseChallenges')}</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.findActiveChallenges')}</div>
                      </div>
                    </button>
                    <button onClick={() => navigate('/expenses')} className={`w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40 hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{t('dashboard.manageExpenses')}</div>
                        <div className="text-xs text-muted-foreground">{t('dashboard.trackAndSplit')}</div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
            {recentExpenseGroups.length > 0 && (
              <Card className="bg-background border border-border/40">
                <CardHeader>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CardTitle className="text-lg">{t('dashboard.recentExpenseGroups')}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')} className="text-xs">{t('dashboard.viewAll')}</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentExpenseGroups.map((group) => (
                    <div key={group.id} onClick={() => navigate('/expenses')} className={`p-4 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Users className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{group.name}</h4>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                      <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-muted-foreground">{group.memberCount} {group.memberCount === 1 ? t('expenses.member') : t('expenses.members')}</span>
                        <span className={`font-semibold ${group.userBalance > 0 ? 'text-success' : group.userBalance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {group.userBalance > 0 ? '+' : ''}{formatCurrency(group.userBalance, 'SAR', i18n.language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Habits Analytics Tab */}
          <TabsContent value="habits"><HabitStatistics /></TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges"><ChallengeProgressChart /></TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses"><ExpenseAnalytics /></TabsContent>
        </Tabs>
      </div>
      <Navigation />
    </div>
  );
}
