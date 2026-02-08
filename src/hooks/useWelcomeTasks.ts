import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const WELCOME_TASKS = [
  { title: 'Welcome to Splitz! 🎉', project: 'Welcome', order_index: 0 },
  { title: 'Try the Eisenhower Matrix', project: 'Welcome', order_index: 1 },
  { title: 'Start a Pomodoro session', project: 'Welcome', order_index: 2 },
  { title: 'Build a habit streak 🔥', project: 'Welcome', order_index: 3 },
];

export function useWelcomeTasks() {
  const queryClient = useQueryClient();

  const { data: hasWelcome } = useQuery({
    queryKey: ['welcome-tasks-check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true; // skip if not logged in

      const { count, error } = await supabase
        .from('focus_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) return true;
      // Only seed if user has zero tasks
      return (count ?? 0) > 0;
    },
    staleTime: Infinity,
  });

  const seedWelcome = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tasks = WELCOME_TASKS.map(t => ({
        ...t,
        user_id: user.id,
      }));

      const { error } = await supabase.from('focus_tasks').insert(tasks);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['welcome-tasks-check'] });
    },
  });

  useEffect(() => {
    if (hasWelcome === false) {
      seedWelcome.mutate();
    }
  }, [hasWelcome]);
}
