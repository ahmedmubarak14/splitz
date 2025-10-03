import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  Gift, 
  CheckCircle, 
  ShoppingCart, 
  TrendingUp, 
  Timer, 
  Target,
  Eye,
  MessageSquare,
  AlertTriangle,
  Plus
} from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Habits',
      value: stats.activeHabits,
      subtitle: 'Active tracking',
      icon: FileText,
      color: 'text-pink-500'
    },
    { 
      label: 'Active Challenges',
      value: stats.activeChallenges,
      subtitle: 'Currently in progress',
      icon: Clock,
      color: 'text-purple-500'
    },
    { 
      label: 'Pending Expenses',
      value: stats.pendingExpenses,
      subtitle: 'Awaiting settlement',
      icon: Gift,
      color: 'text-orange-500'
    },
    { 
      label: 'Longest Streak',
      value: stats.longestStreak,
      subtitle: 'Days maintained',
      icon: CheckCircle,
      color: 'text-green-500'
    },
  ];

  const secondaryStats = [
    { 
      label: 'Total Owed',
      value: `SAR ${stats.totalOwed.toFixed(2)}`,
      subtitle: 'Pending settlements',
      icon: ShoppingCart,
      color: 'text-pink-500'
    },
    { 
      label: 'Success Rate',
      value: '0%',
      subtitle: 'Habit completion rate',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    { 
      label: 'Average Response',
      value: '24h',
      subtitle: 'Settlement time',
      icon: Timer,
      color: 'text-orange-500'
    },
    { 
      label: 'Goals Achieved',
      value: stats.activeChallenges,
      subtitle: 'Challenge completions',
      icon: Target,
      color: 'text-purple-500'
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-6 pb-24 md:pb-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Stats Grid - Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <Card key={idx} className="bg-background border border-border/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Grid - Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, idx) => (
            <Card key={idx} className="bg-background border border-border/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Action Required */}
          <Card className="bg-background border border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="text-base font-semibold">Action Required</h3>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Habits</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stats.activeHabits} habits in progress</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/habits')}
                    className="text-xs"
                  >
                    Monitor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-background border border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="text-base font-semibold">Quick Actions</h3>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/habits')}
                  className="w-full justify-start h-auto py-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Create New Habit</div>
                    <div className="text-xs opacity-90">Start a new habit tracker</div>
                  </div>
                </Button>
                
                <button
                  onClick={() => navigate('/challenges')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40 hover:bg-muted/50 transition-colors text-left"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Browse Challenges</div>
                    <div className="text-xs text-muted-foreground">Find active challenges</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/expenses')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border/40 hover:bg-muted/50 transition-colors text-left"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Manage Expenses</div>
                    <div className="text-xs text-muted-foreground">Track and split expenses</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Performance Section */}
        <Card className="bg-background border border-border/40">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold">Activity Performance</h3>
              <p className="text-xs text-muted-foreground mt-1">Your activity overview</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Habit Success Rate</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: '0%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">0%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Challenge Completion</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: '0%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">0%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Settlement Rate</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: '0%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">0%</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
