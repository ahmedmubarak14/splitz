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

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className={cn('font-semibold', responsiveText.sectionTitle)}>
          {t('nav.tasks') || 'Tasks'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
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
          <div className="w-64 border-r border-border bg-card">
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
          <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className={cn('flex items-center justify-between', responsiveSpacing.pageContainer)}>
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                <div>
                  <h1 className={cn('font-bold', responsiveText.pageTitle)}>
                    {selectedProject}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
              
              {!isMobile && (
                <Button onClick={() => setShowQuickAdd(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className={cn('flex-1 overflow-y-auto', responsiveSpacing.pageContainer, responsiveSpacing.mobileNavPadding)}>
            <TaskList
              tasks={filteredTasks}
              isLoading={isLoading}
              onTaskComplete={(taskId) => {
                // Handle task completion
                queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
              }}
            />
          </div>

          {/* Floating Action Button (Mobile) */}
          {isMobile && (
            <div className="fixed bottom-20 right-4 z-20">
              <Button
                size="lg"
                className="rounded-full w-14 h-14 shadow-lg"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* Add Task Button (Desktop) */}
          {!isMobile && (
            <div className="border-t border-border p-4">
              <Button
                className="w-full"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
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
    </div>
  );
};

export default Tasks;
