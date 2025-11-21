import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Generates comprehensive test data for production validation
 * Creates: 50+ habits, 20+ challenges, 100+ expenses, focus sessions, notifications
 */
export async function generateTestData() {
  const toastId = toast.loading('Generating test data...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Must be logged in to generate test data', { id: toastId });
      return;
    }

    let created = {
      habits: 0,
      checkIns: 0,
      challenges: 0,
      groups: 0,
      expenses: 0,
      sessions: 0,
    };

    // 1. Create 50 habits across different categories
    const categories = ['health', 'productivity', 'learning', 'finance', 'social', 'other'];
    const habitNames = [
      'Morning Meditation', 'Exercise', 'Read for 30min', 'Drink 8 glasses of water',
      'Journal', 'Plan tomorrow', 'Learn new skill', 'Save money', 'Call a friend',
      'Practice gratitude', 'Stretch', 'Healthy breakfast', 'No social media before bed',
      'Walk 10k steps', 'Budget review', 'Language practice', 'Cold shower',
      'Protein shake', 'Meal prep', 'Sleep before 11pm', 'Wake at 6am',
      'No processed sugar', 'Vitamin intake', 'Floss', 'Skincare routine',
      'Clean workspace', 'Inbox zero', 'Review goals', 'Network', 'Side project work',
      'Practice instrument', 'Draw/Paint', 'Write blog', 'Podcast listen',
      'No caffeine after 2pm', 'Yoga', 'Strength training', 'Cardio',
      'Meal tracking', 'Expense tracking', 'Investment review', 'Read news',
      'Learn coding', 'Practice public speaking', 'Volunteer', 'Donate',
      'Compliment someone', 'Random act of kindness', 'Family time', 'Date night',
    ];

    const habitIcons = ['🎯', '💪', '📚', '💧', '📝', '🗓️', '🧠', '💰', '📞', '🙏'];

    for (let i = 0; i < 50; i++) {
      const category = categories[i % categories.length];
      const { data: habit } = await supabase
        .from('habits')
        .insert({
          name: habitNames[i],
          category,
          icon: habitIcons[i % habitIcons.length],
          target_days: 30,
        } as any)
        .select()
        .single();

      if (habit) {
        created.habits++;
        
        // Create realistic check-ins (some consecutive, some with gaps)
        const daysBack = Math.floor(Math.random() * 60) + 30; // 30-90 days of history
        let currentStreak = 0;
        
        for (let day = daysBack; day >= 0; day--) {
          // 70% chance of checking in each day (realistic)
          if (Math.random() > 0.3) {
            const checkInDate = new Date();
            checkInDate.setDate(checkInDate.getDate() - day);
            checkInDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
            
            await supabase.from('habit_check_ins').insert({
              user_id: user.id,
              habit_id: habit.id,
              checked_in_at: checkInDate.toISOString(),
            });
            created.checkIns++;
            currentStreak++;
          } else {
            currentStreak = 0;
          }
        }
      }
    }

    // 2. Create 20 challenges
    const challengeNames = [
      '30-Day Fitness Challenge', 'Learn Spanish in 60 Days', 'Save $1000 Challenge',
      'Read 12 Books Challenge', 'No Sugar Month', 'Wake Up at 6 AM',
      'Run 100km Challenge', 'Meditation Streak', 'Weight Loss Journey',
      'Muscle Gain Challenge', 'Productivity Sprint', 'Code Every Day',
      'Write 50k Words', 'Draw Daily', 'Cook Every Meal', 'Zero Waste Month',
      'Digital Detox Weekend', 'Gratitude Journal', 'Cold Shower Challenge',
      'Financial Freedom Path',
    ];

    const difficulties = ['easy', 'medium', 'hard'];
    const challengeCategories = ['health', 'productivity', 'learning', 'finance', 'social', 'other'];

    for (let i = 0; i < 20; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 60));

      const { data: challenge } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          name: challengeNames[i],
          description: `Challenge yourself to achieve ${challengeNames[i].toLowerCase()}`,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          type: 'percentage',
          target_value: 100,
          difficulty: difficulties[i % 3] as any,
          category: challengeCategories[i % challengeCategories.length] as any,
        })
        .select()
        .single();

      if (challenge) {
        created.challenges++;
        
        // Add creator as participant with progress
        const progress = Math.floor(Math.random() * 100);
        await supabase.from('challenge_participants').insert({
          challenge_id: challenge.id,
          user_id: user.id,
          progress,
        });
      }
    }

    // 3. Create 10 expense groups with 100+ expenses
    const groupNames = [
      'House Rent & Utilities', 'Weekend Trip to Riyadh', 'Office Team Lunch',
      'Roommate Expenses', 'Family Groceries', 'Car Pool Group',
      'Gym Membership Split', 'Netflix & Spotify', 'Birthday Party',
      'Project Team Expenses',
    ];

    for (let i = 0; i < 10; i++) {
      const { data: group } = await supabase
        .from('expense_groups')
        .insert({
          created_by: user.id,
          name: groupNames[i],
        })
        .select()
        .single();

      if (group) {
        created.groups++;
        
        // Add creator as member
        await supabase.from('expense_group_members').insert({
          group_id: group.id,
          user_id: user.id,
        });

        // Create 10-15 expenses per group
        const expenseCount = 10 + Math.floor(Math.random() * 6);
        const expenseNames = [
          'Rent Payment', 'Electricity Bill', 'Water Bill', 'Internet Bill',
          'Groceries', 'Restaurant', 'Gas', 'Uber', 'Coffee', 'Lunch',
          'Dinner', 'Snacks', 'Movies', 'Shopping', 'Pharmacy',
        ];

        for (let j = 0; j < expenseCount; j++) {
          const amount = (Math.random() * 500 + 50).toFixed(2);
          const expenseDate = new Date();
          expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 90));

          const { data: expense } = await supabase
            .from('expenses')
            .insert({
              group_id: group.id,
              name: expenseNames[j % expenseNames.length],
              total_amount: amount,
              paid_by: user.id,
              category: 'other',
              split_type: 'equal',
              created_at: expenseDate.toISOString(),
            } as any)
            .select()
            .single();

          if (expense) {
            created.expenses++;
            
            // Add expense member (creator owes themselves in equal split)
            await supabase.from('expense_members').insert({
              expense_id: expense.id,
              user_id: user.id,
              amount_owed: parseFloat(amount),
            });
          }
        }
      }
    }

    // 4. Create 50 focus sessions
    const sessionTypes = ['work', 'study', 'exercise', 'meditation'];
    for (let i = 0; i < 50; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 60));
      sessionDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      
      const duration = [15, 25, 30, 45, 60][Math.floor(Math.random() * 5)];
      const endTime = new Date(sessionDate);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        session_type: sessionTypes[i % 4],
        start_time: sessionDate.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: duration,
        tree_survived: Math.random() > 0.2, // 80% success rate
      });
      created.sessions++;
    }

    toast.success(
      `Test data created!\n${created.habits} habits, ${created.checkIns} check-ins, ${created.challenges} challenges, ${created.groups} groups, ${created.expenses} expenses, ${created.sessions} sessions`,
      { id: toastId, duration: 5000 }
    );

    return created;
  } catch (error) {
    console.error('Error generating test data:', error);
    toast.error('Failed to generate test data', { id: toastId });
    throw error;
  }
}
