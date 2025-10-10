import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Award, Target } from 'lucide-react';

export function HabitStatistics() {
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
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>
            <div className="text-2xl font-bold">{stats.bestStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">This Week</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <div className="text-xs text-muted-foreground">check-ins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Completion</span>
            </div>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-xs text-muted-foreground">rate</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Weekly Activity</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="checkIns" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
