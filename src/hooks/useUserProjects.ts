import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface UserProject {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  order_index: number;
}

const DEFAULT_PROJECTS = [
  { name: 'Welcome', emoji: '👋', order_index: 0 },
  { name: 'Inbox', emoji: '📥', order_index: 1 },
  { name: 'Work', emoji: '💼', order_index: 2 },
  { name: 'Personal', emoji: '🏠', order_index: 3 },
  { name: 'Learning', emoji: '📚', order_index: 4 },
];

export function useUserProjects() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data ?? []) as UserProject[];
    },
  });

  // Seed defaults when user has no projects
  const seedDefaults = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rows = DEFAULT_PROJECTS.map(p => ({ ...p, user_id: user.id }));
      const { error } = await supabase.from('user_projects').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
    },
  });

  useEffect(() => {
    if (projects !== undefined && projects.length === 0) {
      seedDefaults.mutate();
    }
  }, [projects]);

  const addProject = useMutation({
    mutationFn: async ({ name, emoji }: { name: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const maxOrder = (projects ?? []).reduce((max, p) => Math.max(max, p.order_index), -1);
      const { error } = await supabase.from('user_projects').insert({
        user_id: user.id,
        name,
        emoji,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects'] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, name, emoji }: { id: string; name: string; emoji: string }) => {
      const { error } = await supabase
        .from('user_projects')
        .update({ name, emoji })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects'] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects'] }),
  });

  const reorderProjects = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('user_projects').update({ order_index: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects'] }),
  });

  return {
    projects: projects ?? [],
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}
