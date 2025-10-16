import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import { toast } from 'sonner';

const Matrix = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Fetch all tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['focus-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('focus_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Update task quadrant
  const updateQuadrant = useMutation({
    mutationFn: async ({ taskId, quadrant }: { taskId: string; quadrant: any }) => {
      const { error } = await supabase
        .from('focus_tasks')
        .update({ priority_quadrant: quadrant as any })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      toast.success('Task priority updated');
    },
    onError: () => {
      toast.error('Failed to update task priority');
    },
  });

  const handleMoveTask = (taskId: string, quadrant: string | null) => {
    updateQuadrant.mutate({ taskId, quadrant });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={cn('max-w-7xl mx-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn('font-bold mb-2', responsiveText.pageTitle)}>
            {t('matrix.title') || 'Eisenhower Matrix'}
          </h1>
          <p className="text-muted-foreground">
            {t('matrix.subtitle') || 'Prioritize your tasks using the Eisenhower Matrix'}
          </p>
        </div>

        {/* Matrix */}
        <EisenhowerMatrix
          tasks={tasks || []}
          isLoading={isLoading}
          onMoveTask={handleMoveTask}
        />
      </div>
    </div>
  );
};

export default Matrix;
