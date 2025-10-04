import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Award, Target } from 'lucide-react';

interface HabitStatisticsProps {
  habitId: string;
  habitName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HabitStatistics = ({ habitId, habitName, open, onOpenChange }: HabitStatisticsProps) => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    completionRate: 0,
    longestStreak: 0,
    thisWeek: 0,
    lastWeek: 0,
  });

  useEffect(() => {
    if (open) {
      fetchStatistics();
    }
  }, [open, habitId]);

  const fetchStatistics = async () => {
    try {
      const { data: checkIns } = await supabase
        .from('habit_check_ins')
        .select('checked_in_at')
        .eq('habit_id', habitId)
        .order('checked_in_at', { ascending: true });

      const { data: habit } = await supabase
        .from('habits')
        .select('best_streak, target_days, created_at')
        .eq('id', habitId)
        .single();

      if (!checkIns || !habit) return;

      // Calculate weekly data for last 4 weeks
      const now = new Date();
      const weeklyCheckins = Array(4).fill(0);
      
      checkIns.forEach((checkIn) => {
        const date = new Date(checkIn.checked_in_at);
        const weeksAgo = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksAgo >= 0 && weeksAgo < 4) {
          weeklyCheckins[3 - weeksAgo]++;
        }
      });

      const chartData = weeklyCheckins.map((count, index) => ({
        week: `Week ${index + 1}`,
        checkins: count,
      }));

      setWeeklyData(chartData);

      // Calculate stats
      const totalDays = Math.max(1, Math.ceil((now.getTime() - new Date(habit.created_at).getTime()) / (24 * 60 * 60 * 1000)));
      const completionRate = Math.round((checkIns.length / totalDays) * 100);

      setStats({
        totalCheckins: checkIns.length,
        completionRate: Math.min(100, completionRate),
        longestStreak: habit.best_streak || 0,
        thisWeek: weeklyCheckins[3],
        lastWeek: weeklyCheckins[2],
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {habitName} Statistics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Total Check-ins
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.totalCheckins}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Target className="w-4 h-4" />
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.completionRate}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Award className="w-4 h-4" />
                  Best Streak
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.longestStreak}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  This Week
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stats.thisWeek}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Last 4 Weeks Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs text-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar 
                    dataKey="checkins" 
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                Insights
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    {stats.thisWeek > stats.lastWeek 
                      ? `Great job! You're ${stats.thisWeek - stats.lastWeek} check-ins ahead of last week 🎉`
                      : stats.thisWeek === stats.lastWeek
                      ? `You're maintaining consistency! Keep it up 💪`
                      : `You can do better! Try to beat last week's ${stats.lastWeek} check-ins`
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Your completion rate is {stats.completionRate}% - 
                    {stats.completionRate >= 80 ? ' Excellent! 🌟' : 
                     stats.completionRate >= 50 ? ' Good progress! 👍' : ' Keep pushing! 💪'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Your best streak is {stats.longestStreak} days. Can you beat it? 🔥
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HabitStatistics;
