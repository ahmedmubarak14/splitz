import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  requirement: {
    type: string;
    value: number;
  };
}

export const useAchievements = () => {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const checkAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (!allAchievements) return;

    // Get user's unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

    // Get user stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('login_streak, level, xp')
      .eq('id', user.id)
      .single();

    const { count: habitCount } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: focusCount } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: friendCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const { count: challengesCreated } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id);

    const stats = {
      habit_count: habitCount || 0,
      login_streak: profile?.login_streak || 0,
      focus_sessions: focusCount || 0,
      friend_count: friendCount || 0,
      challenges_created: challengesCreated || 0,
      challenges_won: 0, // TODO: Implement win tracking
      early_checkin: 0 // TODO: Implement time tracking
    };

    // Check each achievement
    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const { type, value } = achievement.requirement as { type: string; value: number };
      const currentValue = stats[type as keyof typeof stats] || 0;

      if (currentValue >= value) {
        // Unlock achievement
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id
          });

        if (!error) {
          // Award XP
          await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_amount: achievement.xp_reward
          });

          setNewAchievement({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            xp_reward: achievement.xp_reward,
            category: achievement.category,
            requirement: achievement.requirement as { type: string; value: number }
          });
        }
      }
    }
  };

  useEffect(() => {
    checkAchievements();

    // Subscribe to relevant tables
    const channels = [
      supabase.channel('habits-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habits'
      }, checkAchievements).subscribe(),

      supabase.channel('focus-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'focus_sessions'
      }, checkAchievements).subscribe(),

      supabase.channel('profile-changes').on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, checkAchievements).subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  return {
    newAchievement,
    clearAchievement: () => setNewAchievement(null)
  };
};
