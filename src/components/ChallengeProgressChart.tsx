import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ProgressHistory {
  progress: number;
  recorded_at: string;
}

interface ChallengeProgressChartProps {
  challengeId: string;
  userId: string;
}

const ChallengeProgressChart = ({ challengeId, userId }: ChallengeProgressChartProps) => {
  const [history, setHistory] = useState<ProgressHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressHistory();
  }, [challengeId, userId]);

  const fetchProgressHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_progress_history')
        .select('progress, recorded_at')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching progress history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || history.length === 0) {
    return null;
  }

  const chartData = history.map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    progress: item.progress,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Progress Over Time</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs text-muted-foreground"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              stroke="hsl(var(--muted-foreground))"
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="progress" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Milestone lines */}
            <Line y={25} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
            <Line y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
            <Line y={75} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ChallengeProgressChart;
