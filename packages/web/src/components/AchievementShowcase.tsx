import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement: {
    type: string;
    value: number;
  };
  unlocked?: boolean;
  unlocked_at?: string;
}

export const AchievementShowcase = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward', { ascending: true });

      // Get user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      const unlockedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []
      );

      const achievementsWithStatus = allAchievements?.map(achievement => ({
        ...achievement,
        requirement: achievement.requirement as { type: string; value: number },
        unlocked: unlockedMap.has(achievement.id),
        unlocked_at: unlockedMap.get(achievement.id)
      })) || [];

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const displayAchievements = showAll ? achievements : achievements.slice(0, 6);

  if (loading) {
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="border-b border-border/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg font-bold tracking-tight">
              {t('gamification.achievement.showcase')}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {t('gamification.achievement.unlocked_count', { count: unlockedCount })} / {achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {displayAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-lg border transition-all duration-200 ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-sm hover:shadow-md'
                  : 'bg-muted/30 border-border/40 opacity-60'
              }`}
            >
              {!achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="text-3xl mb-2 filter drop-shadow-md">
                  {achievement.icon}
                </div>
                <h4 className="font-semibold text-xs mb-1 line-clamp-1">
                  {achievement.name}
                </h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
                  {achievement.description}
                </p>
                <Badge variant={achievement.unlocked ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                  {achievement.unlocked ? `+${achievement.xp_reward} XP` : t('gamification.achievement.locked')}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
        
        {achievements.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {showAll ? '← Show Less' : t('gamification.achievement.viewAll')}
          </button>
        )}
      </CardContent>
    </Card>
  );
};