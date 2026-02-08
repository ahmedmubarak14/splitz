import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Menu, Settings, LayoutList, Columns3, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import ProjectSelector from '@/components/ProjectSelector';
import QuickAddTask from '@/components/QuickAddTask';
import ProjectManagementDialog from '@/components/ProjectManagementDialog';
import ProjectTaskGroup from '@/components/ProjectTaskGroup';
import KanbanBoard from '@/components/KanbanBoard';
import { toast } from 'sonner';
import { MobileQuickActionsFAB } from '@/components/MobileQuickActionsFAB';
import { Link } from 'react-router-dom';

type ViewMode = 'list' | 'kanban';

const PROJECT_EMOJIS: Record<string, string> = {
  Inbox: '📥',
  Today: '☀️',
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
  const [selectedProject, setSelectedProject] = useState<string | null>(null); // null = all projects
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  // Get unique projects
  const projects = useMemo(() => {
    return Array.from(new Set(tasks?.map(t => t.project || 'Inbox') || ['Inbox']));
  }, [tasks]);

  // Filter tasks by selected project (null = all)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!selectedProject) return tasks;
    return tasks.filter(t => (t.project || 'Inbox') === selectedProject);
  }, [tasks, selectedProject]);

  // Group tasks by project for list view
  const groupedByProject = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    filteredTasks.forEach(task => {
      const proj = task.project || 'Inbox';
      if (!groups[proj]) groups[proj] = [];
      groups[proj].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
        <h2 className={cn('font-semibold tracking-tight', responsiveText.sectionTitle)}>
          {t('nav.tasks')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent/50 transition-colors duration-200"
          onClick={() => setShowProjectManager(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2">
        <button
          onClick={() => {
            setSelectedProject(null);
            if (isMobile) setSidebarOpen(false);
          }}
          className={cn(
            'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedProject === null
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          {t('tasks.allProjects')}
        </button>
      </div>
      <ProjectSelector
        projects={projects}
        selectedProject={selectedProject || ''}
        onSelectProject={(project) => {
          setSelectedProject(project);
          if (isMobile) setSidebarOpen(false);
        }}
      />
    </div>
  );

  const totalIncomplete = filteredTasks.filter(t => !t.is_completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-64 border-r border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
            <SidebarContent />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-border/40 bg-card/50 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
            <div className={cn('flex items-center justify-between', responsiveSpacing.pageContainer)}>
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent/50 transition-colors duration-200"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                <div>
                  <h1 className={cn('font-bold tracking-tight', responsiveText.pageTitle)}>
                    {selectedProject || t('tasks.allProjects')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {totalIncomplete} {totalIncomplete === 1 ? t('tasks.task') : t('tasks.taskPlural')}
                  </p>
                </div>
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
              <div className="space-y-3">
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
                tasks={filteredTasks}
                isLoading={isLoading}
                onAddTask={() => setShowQuickAdd(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        defaultProject={selectedProject || 'Inbox'}
      />

      {/* Project Management Dialog */}
      <ProjectManagementDialog
        open={showProjectManager}
        onOpenChange={setShowProjectManager}
        projects={projects}
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
