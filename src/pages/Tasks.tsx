import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, responsiveText } from '@/lib/responsive-utils';
import TaskList from '@/components/TaskList';
import ProjectSelector from '@/components/ProjectSelector';
import QuickAddTask from '@/components/QuickAddTask';
import ProjectManagementDialog from '@/components/ProjectManagementDialog';
import { toast } from 'sonner';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { MobileQuickActionsFAB } from '@/components/MobileQuickActionsFAB';
import { isToday, isPast, isThisWeek } from 'date-fns';

const Tasks = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('Inbox');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const projects = Array.from(new Set(tasks?.map(t => t.project) || ['Inbox']));

  const filteredTasks = tasks?.filter(t => t.project === selectedProject) || [];

  // Group tasks by sections
  const todayTasks = filteredTasks.filter(
    (t) => !t.is_completed && t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date)))
  );
  const thisWeekTasks = filteredTasks.filter(
    (t) => !t.is_completed && t.due_date && isThisWeek(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && !isPast(new Date(t.due_date))
  );
  const laterTasks = filteredTasks.filter(
    (t) => !t.is_completed && (!t.due_date || (!isThisWeek(new Date(t.due_date)) && !isPast(new Date(t.due_date))))
  );
  const completedTasks = filteredTasks.filter((t) => t.is_completed);

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
      <ProjectSelector
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={(project) => {
          setSelectedProject(project);
          if (isMobile) setSidebarOpen(false);
        }}
      />
    </div>
  );

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
                    {selectedProject}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length} {filteredTasks.length === 1 ? t('tasks.task') : t('tasks.taskPlural')}
                  </p>
                </div>
              </div>
              
              {!isMobile && (
                <Button onClick={() => setShowQuickAdd(true)} className="shadow-sm hover:shadow-md transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('tasks.addTask')}
                </Button>
              )}
            </div>
          </div>

          {/* Task List with Collapsible Sections */}
          <div className={cn('flex-1 overflow-y-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
            <div className="space-y-6">
              {/* Today & Overdue */}
              {todayTasks.length > 0 && (
                <CollapsibleSection
                  title={t('tasks.today')}
                  emoji="🔥"
                  count={todayTasks.length}
                  storageKey={`tasks-today-${selectedProject}`}
                  actions={[
                    {
                      label: t('tasks.markAllComplete'),
                      onClick: () => {
                        // Mark all as complete
                        toast.success(t('tasks.markAllComplete'));
                      },
                    },
                  ]}
                >
                  <TaskList
                    tasks={todayTasks}
                    isLoading={isLoading}
                    onTaskComplete={() => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] })}
                  />
                </CollapsibleSection>
              )}

              {/* This Week */}
              {thisWeekTasks.length > 0 && (
                <CollapsibleSection
                  title={t('tasks.thisWeek')}
                  emoji="📅"
                  count={thisWeekTasks.length}
                  storageKey={`tasks-week-${selectedProject}`}
                >
                  <TaskList
                    tasks={thisWeekTasks}
                    isLoading={isLoading}
                    onTaskComplete={() => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] })}
                  />
                </CollapsibleSection>
              )}

              {/* Later */}
              {laterTasks.length > 0 && (
                <CollapsibleSection
                  title={t('tasks.later')}
                  emoji="📌"
                  count={laterTasks.length}
                  defaultOpen={false}
                  storageKey={`tasks-later-${selectedProject}`}
                >
                  <TaskList
                    tasks={laterTasks}
                    isLoading={isLoading}
                    onTaskComplete={() => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] })}
                  />
                </CollapsibleSection>
              )}

              {/* Completed */}
              {completedTasks.length > 0 && (
                <CollapsibleSection
                  title={t('tasks.completed')}
                  emoji="✅"
                  count={completedTasks.length}
                  defaultOpen={false}
                  storageKey={`tasks-completed-${selectedProject}`}
                  actions={[
                    {
                      label: t('tasks.clearCompleted'),
                      onClick: () => {
                        toast.success(t('tasks.clearCompleted'));
                      },
                      variant: 'destructive',
                    },
                  ]}
                >
                  <TaskList
                    tasks={completedTasks}
                    isLoading={isLoading}
                    onTaskComplete={() => queryClient.invalidateQueries({ queryKey: ['focus-tasks'] })}
                  />
                </CollapsibleSection>
              )}

              {filteredTasks.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                    <Plus className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Create your first task to get started with your productivity journey
                  </p>
                  <Button onClick={() => setShowQuickAdd(true)} className="shadow-sm hover:shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('tasks.addTask')}
                  </Button>
                </div>
              )}
            </div>
          </div>


          {/* Add Task Button (Desktop) */}
          {!isMobile && (
            <div className="border-t border-border p-4">
              <Button
                className="w-full"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('tasks.addTask')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        defaultProject={selectedProject}
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

export default Tasks;
