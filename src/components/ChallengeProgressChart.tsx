import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from './ui/progress';
import { Trophy, Users, Clock, TrendingUp } from 'lucide-react';

interface ChallengeWithProgress {
  id: string;
  name: string;
  end_date: string;
  type: string;
  category: string;
  difficulty: string;
  progress: number;
  participantCount: number;
  daysRemaining: number;
}

export function ChallengeProgressChart() {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', user.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(3);

      const { data: participantData } = await supabase
        .from('challenge_participants')
        .select('challenge_id, progress, challenges(*)')
        .eq('user_id', user.id);

      const participatedChallenges = participantData?.filter(p => p.challenges && new Date((p.challenges as any).end_date) >= new Date())
        .map(p => ({ ...(p.challenges as any), userProgress: p.progress }))
        .slice(0, 3) || [];

      const allChallenges = [...(userChallenges || []), ...participatedChallenges.filter(pc => !userChallenges?.some(uc => uc.id === pc.id))];

      const challengesWithData = await Promise.all(allChallenges.map(async (challenge: any) => {
        const { count } = await supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('challenge_id', challenge.id);
        const { data: participants } = await supabase.from('challenge_participants').select('progress').eq('challenge_id', challenge.id).eq('user_id', user.id).single();
        const daysRemaining = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return { ...challenge, progress: participants?.progress || challenge.userProgress || 0, participantCount: (count || 0) + 1, daysRemaining };
      }));

      setChallenges(challengesWithData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card><CardContent className="p-6"><div className="animate-pulse h-40 bg-muted rounded"></div></CardContent></Card>;

  if (challenges.length === 0) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground"><Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No active challenges</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Active Challenges</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{challenge.name}</h4>
              <span className="text-xs font-semibold text-primary">{challenge.progress}%</span>
            </div>
            <Progress value={challenge.progress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Users className="h-3 w-3" /><span>{challenge.participantCount}</span></div>
              <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{challenge.daysRemaining}d left</span></div>
              <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /><span className="capitalize">{challenge.difficulty}</span></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
