import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Snowflake } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface StreakData {
  login_streak: number;
  best_login_streak: number;
  streak_freezes_used: number;
  level: number;
  xp: number;
}

export const StreakDisplay = () => {
  const { t } = useTranslation();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const fetchStreakData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('login_streak, best_login_streak, streak_freezes_used, level, xp')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      const oldStreak = streakData?.login_streak || 0;
      setStreakData(data);
      
      // Show celebration for milestone streaks
      if (data.login_streak > oldStreak && [7, 14, 30, 60, 100].includes(data.login_streak)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success(t('gamification.streak.milestoneToast', { count: data.login_streak }), {
          description: t('gamification.streak.milestoneDescription')
        });
      }
    }
  };

  const updateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Trigger streak update by updating profile
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    await fetchStreakData();
  };

  useEffect(() => {
    fetchStreakData();
    updateStreak();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchStreakData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!streakData) return null;

  const freezesRemaining = 2 - streakData.streak_freezes_used;
  const nextLevelXP = Math.pow(streakData.level, 2) * 100;
  const xpProgress = (streakData.xp % nextLevelXP) / nextLevelXP * 100;

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      
      <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <span className="text-foreground">{streakData.login_streak}</span>
              <span className="text-sm text-muted-foreground font-normal">
                {t('common.day_streak', { count: streakData.login_streak })}
              </span>
            </div>
            
            {streakData.login_streak > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: freezesRemaining }).map((_, i) => (
                  <Snowflake key={i} className="w-4 h-4 text-blue-500" />
                ))}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">{t('gamification.streak.level')} {streakData.level}</div>
            <div className="text-xs text-muted-foreground">
              {streakData.xp % nextLevelXP} / {nextLevelXP} {t('gamification.streak.xp')}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          {streakData.best_login_streak > streakData.login_streak && (
            <p className="text-xs text-muted-foreground text-center">
              {t('gamification.streak.best')}: {streakData.best_login_streak} {t('gamification.streak.daysCount')}
            </p>
          )}

          {freezesRemaining > 0 && streakData.login_streak >= 3 && (
            <p className="text-xs text-blue-500 text-center">
              {t('gamification.streak.freezesRemaining', {
                count: freezesRemaining,
                freeze: freezesRemaining === 1 ? t('gamification.streak.freeze') : t('gamification.streak.freezes')
              })}
            </p>
          )}
        </div>
      </Card>
    </>
  );
};
