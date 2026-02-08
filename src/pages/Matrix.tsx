import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { MobileQuickActionsFAB } from '@/components/MobileQuickActionsFAB';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import QuickAddTask from '@/components/QuickAddTask';
import { toast } from 'sonner';

const Matrix = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

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

  const handleAddToQuadrant = (quadrant: string) => {
    setSelectedQuadrant(quadrant);
    setQuickAddOpen(true);
  };

  const handleQuickAddClose = (open: boolean) => {
    setQuickAddOpen(open);
    if (!open) setSelectedQuadrant(null);
  };

  const taskStats = {
    total: tasks?.filter(t => !t.is_completed).length || 0,
    inMatrix: tasks?.filter(t => t.priority_quadrant && !t.is_completed).length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-muted/10 to-background">
      <div className={cn('max-w-7xl mx-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className={cn('font-bold tracking-tight', responsiveText.pageTitle)}>
              {t('matrix.title')}
            </h1>
            
            <div className="flex items-center gap-2">
              <Link to="/tasks">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <ListTodo className="w-4 h-4 mr-2" />
                  {t('matrix.viewAllTasks')}
                </Button>
              </Link>
              <Button onClick={() => setQuickAddOpen(true)} className="shadow-sm hover:shadow-md transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                {t('matrix.addTask')}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('matrix.subtitle')}
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-muted-foreground">
              {t('matrix.statsInMatrix', { count: taskStats.inMatrix })}
            </span>
            <span className="text-muted-foreground">
              {t('matrix.statsTotal', { count: taskStats.total })}
            </span>
          </div>
        </div>

        {/* Matrix */}
        <EisenhowerMatrix
          tasks={tasks || []}
          isLoading={isLoading}
          onMoveTask={handleMoveTask}
          onAddToQuadrant={handleAddToQuadrant}
        />

        {/* Quick Add Task Dialog */}
        <QuickAddTask
          open={quickAddOpen}
          onOpenChange={handleQuickAddClose}
          defaultQuadrant={selectedQuadrant}
        />

        {/* Mobile FAB */}
        <MobileQuickActionsFAB 
          onAddTask={() => setQuickAddOpen(true)}
        />
      </div>
    </div>
  );
};

export default Matrix;
