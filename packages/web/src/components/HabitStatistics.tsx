import { useEffect, useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, Award, Target } from 'lucide-react';

// Lazy load recharts for better bundle size
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
import { useTranslation } from 'react-i18next';

export function HabitStatistics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{
    weeklyData: Array<{ day: string; checkIns: number }>;
    totalCheckIns: number;
    currentStreak: number;
    bestStreak: number;
    completionRate: number;
  }>({
    weeklyData: [],
    totalCheckIns: 0,
    currentStreak: 0,
    bestStreak: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (!habits) return;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const { data: checkIns } = await supabase
        .from('habit_check_ins')
        .select('checked_in_at')
        .eq('user_id', user.id)
        .gte('checked_in_at', last7Days[0]);

      const weeklyData = last7Days.map(date => {
        const dayCheckIns = checkIns?.filter(c => 
          c.checked_in_at.startsWith(date)
        ).length || 0;
        
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        return { day: dayName, checkIns: dayCheckIns };
      });

      const currentStreak = habits.reduce((max, h) => Math.max(max, h.streak_count || 0), 0);
      const bestStreak = habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0);
      const totalCheckIns = checkIns?.length || 0;
      const expectedCheckIns = habits.length * 7;
      const completionRate = expectedCheckIns > 0 ? Math.round((totalCheckIns / expectedCheckIns) * 100) : 0;

      setStats({ weeklyData, totalCheckIns, currentStreak, bestStreak, completionRate });
    } catch (error) {
      console.error('Error fetching habit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse h-40 bg-muted rounded"></div></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('habits.statistics.currentStreak')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">{t('habits.days')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{t('habits.statistics.bestStreak')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.bestStreak}</div>
            <div className="text-xs text-muted-foreground">{t('habits.days')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">{t('habits.statistics.thisWeek')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <div className="text-xs text-muted-foreground">{t('habits.statistics.checkIns')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">{t('habits.statistics.completion')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-xs text-muted-foreground">{t('habits.statistics.rate')}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('habits.statistics.weeklyActivity')}</CardTitle></CardHeader>
        <CardContent>
          <Suspense fallback={<div className="animate-pulse h-[200px] bg-muted rounded" />}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="checkIns" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
