import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import QuickAddTask from '@/components/QuickAddTask';
import { toast } from 'sonner';

const Matrix = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
      toast.success(t('matrix.taskPriorityUpdated'));
    },
    onError: () => {
      toast.error(t('matrix.taskPriorityUpdateFailed'));
    },
  });

  const handleMoveTask = (taskId: string, quadrant: string | null) => {
    updateQuadrant.mutate({ taskId, quadrant });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background">
      <div className={cn('max-w-7xl mx-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h1 className={cn('font-bold tracking-tight mb-2', responsiveText.pageTitle)}>
              {t('matrix.title')}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t('matrix.subtitle')}
            </p>
          </div>
          
          <Button onClick={() => setQuickAddOpen(true)} className="shadow-sm hover:shadow-md transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            {t('matrix.addTask')}
          </Button>
        </div>

        {/* Matrix */}
        <EisenhowerMatrix
          tasks={tasks || []}
          isLoading={isLoading}
          onMoveTask={handleMoveTask}
        />

        {/* Quick Add Task Dialog */}
        <QuickAddTask
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
        />

        {/* Mobile FAB */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-20">
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-2xl hover:shadow-3xl active:scale-95 transition-all duration-200"
              onClick={() => setQuickAddOpen(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matrix;
