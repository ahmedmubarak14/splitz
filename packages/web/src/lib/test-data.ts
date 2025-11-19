import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const generateTestData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in first');
      return false;
    }

    // Generate habits
    const testHabits = [
      { name: 'Morning Meditation', icon: '🧘', category: 'mindfulness' as const, target_days: 30, description: '10 minutes of mindfulness' },
      { name: 'Daily Workout', icon: '💪', category: 'fitness' as const, target_days: 30, description: '30 minutes exercise' },
      { name: 'Read for 30 Minutes', icon: '📖', category: 'learning' as const, target_days: 30, description: 'Read before bed' },
      { name: 'Drink 8 Glasses Water', icon: '💧', category: 'health' as const, target_days: 30, description: 'Stay hydrated' },
      { name: 'No Phone Before 9 AM', icon: '📵', category: 'productivity' as const, target_days: 21, description: 'Digital detox morning' },
    ];

    const { data: createdHabits, error: habitsError } = await supabase
      .from('habits')
      .insert(testHabits.map(h => ({
        ...h,
        user_id: user.id,
      })))
      .select();

    if (habitsError) throw habitsError;

    // Add check-ins for streaks
    if (createdHabits && createdHabits.length > 0) {
      const today = new Date();
      const checkIns = [];
      
      for (const habit of createdHabits) {
        // Create 7-day streak
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          checkIns.push({
            habit_id: habit.id,
            user_id: user.id,
            checked_in_at: date.toISOString(),
          });
        }
      }

      const { error: checkInsError } = await supabase
        .from('habit_check_ins')
        .insert(checkIns);

      if (checkInsError) throw checkInsError;
    }

    // Generate challenges
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const testChallenges = [
      { 
        name: '30-Day Plank Challenge', 
        description: 'Build core strength with daily planks',
        category: 'fitness' as const,
        difficulty: 'medium' as const,
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
      { 
        name: 'Read 10 Books', 
        description: 'Read 10 books in 90 days',
        category: 'learning' as const,
        difficulty: 'hard' as const,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      { 
        name: 'Daily Gratitude', 
        description: 'Write 3 things you\'re grateful for every day',
        category: 'productivity' as const,
        difficulty: 'easy' as const,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const { data: createdChallenges, error: challengesError } = await supabase
      .from('challenges')
      .insert(testChallenges.map(c => ({
        ...c,
        creator_id: user.id,
      })))
      .select();

    if (challengesError) throw challengesError;

    // Add user as participant with some progress
    if (createdChallenges && createdChallenges.length > 0) {
      const participants = createdChallenges.map((c, idx) => ({
        challenge_id: c.id,
        user_id: user.id,
        progress: (idx + 1) * 25, // 25%, 50%, 75%
      }));

      const { error: participantsError } = await supabase
        .from('challenge_participants')
        .insert(participants);

      if (participantsError) throw participantsError;
    }

    // Generate focus sessions
    const testSessions = [
      { duration_minutes: 25, tree_survived: true, session_type: 'work', end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { duration_minutes: 25, tree_survived: true, session_type: 'work', end_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { duration_minutes: 15, tree_survived: false, session_type: 'work', end_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    ];

    const { error: sessionsError } = await supabase
      .from('focus_sessions')
      .insert(testSessions.map(s => ({
        ...s,
        user_id: user.id,
        start_time: new Date(new Date(s.end_time).getTime() - s.duration_minutes * 60 * 1000).toISOString(),
      })));

    if (sessionsError) throw sessionsError;

    toast.success('Test data generated successfully!');
    return true;
  } catch (error: any) {
    console.error('Test data generation error:', error);
    toast.error(error.message || 'Failed to generate test data');
    return false;
  }
};
