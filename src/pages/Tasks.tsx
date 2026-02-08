import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, LayoutList, Columns3, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import QuickAddTask from '@/components/QuickAddTask';
import ProjectTaskGroup from '@/components/ProjectTaskGroup';
import KanbanBoard from '@/components/KanbanBoard';
import { MobileQuickActionsFAB } from '@/components/MobileQuickActionsFAB';
import { Link } from 'react-router-dom';
import { useWelcomeTasks } from '@/hooks/useWelcomeTasks';

type ViewMode = 'list' | 'kanban';

const PROJECT_EMOJIS: Record<string, string> = {
  Welcome: '👋',
  Inbox: '📥',
  Work: '💼',
  Personal: '🏠',
  Learning: '📚',
};

const getProjectEmoji = (project: string): string => {
  return PROJECT_EMOJIS[project] || '📁';
};

const Tasks = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Seed welcome tasks for new users
  useWelcomeTasks();

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
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const allTasks = tasks || [];

  // Group tasks by project for list view, ordered like the design
  const groupedByProject = useMemo(() => {
    const groups: Record<string, typeof allTasks> = {};
    const projectOrder = ['Welcome', 'Inbox', 'Work', 'Personal', 'Learning'];

    allTasks.forEach(task => {
      const proj = task.project || 'Inbox';
      if (!groups[proj]) groups[proj] = [];
      groups[proj].push(task);
    });

    // Return entries sorted by predefined order, unknown projects go last
    const sorted: Record<string, typeof allTasks> = {};
    projectOrder.forEach(p => {
      if (groups[p]) sorted[p] = groups[p];
    });
    Object.keys(groups).forEach(p => {
      if (!sorted[p]) sorted[p] = groups[p];
    });
    return sorted;
  }, [allTasks]);

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });

  const totalIncomplete = allTasks.filter(t => !t.is_completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-border/40 bg-card/50 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
          <div className={cn('flex items-center justify-between', responsiveSpacing.pageContainer)}>
            <div>
              <h1 className={cn('font-bold tracking-tight', responsiveText.pageTitle)}>
                {t('tasks.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalIncomplete} {totalIncomplete === 1 ? t('tasks.task') : t('tasks.taskPlural')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('kanban')}
                >
                  <Columns3 className="w-4 h-4" />
                </Button>
              </div>

              {/* Matrix Link */}
              <Link to="/matrix">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  {t('tasks.viewMatrix')}
                </Button>
              </Link>

              {!isMobile && (
                <Button onClick={() => setShowQuickAdd(true)} className="shadow-sm hover:shadow-md transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('tasks.addTask')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={cn('flex-1 overflow-y-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
          {viewMode === 'list' ? (
            <div className="space-y-3 max-w-4xl mx-auto">
              {Object.keys(groupedByProject).length === 0 && !isLoading ? (
                <EmptyTasksState onAdd={() => setShowQuickAdd(true)} />
              ) : (
                Object.entries(groupedByProject).map(([project, projectTasks]) => (
                  <ProjectTaskGroup
                    key={project}
                    projectName={project}
                    emoji={getProjectEmoji(project)}
                    tasks={projectTasks}
                    onTaskComplete={invalidateTasks}
                  />
                ))
              )}
            </div>
          ) : (
            <KanbanBoard
              tasks={allTasks}
              isLoading={isLoading}
              onAddTask={() => setShowQuickAdd(true)}
            />
          )}
        </div>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        defaultProject="Inbox"
      />

      {/* Mobile Quick Actions FAB */}
      <MobileQuickActionsFAB onAddTask={() => setShowQuickAdd(true)} />
    </div>
  );
};

const EmptyTasksState = ({ onAdd }: { onAdd: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
        <Plus className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('tasks.emptyState.title')}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        {t('tasks.emptyState.description')}
      </p>
      <Button onClick={onAdd} className="shadow-sm hover:shadow-md">
        <Plus className="w-4 h-4 mr-2" />
        {t('tasks.addTask')}
      </Button>
    </div>
  );
};

export default Tasks;
