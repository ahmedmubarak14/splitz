import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Square, ArrowRight } from 'lucide-react';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsRTL } from '@/lib/rtl-utils';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  priority_quadrant: string | null;
  due_date: string | null;
}

interface TodaysTasksWidgetProps {
  tasks: Task[];
  onRefresh: () => void;
}

export function TodaysTasksWidget({ tasks, onRefresh }: TodaysTasksWidgetProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    setUpdating(taskId);
    try {
      const { error } = await supabase
        .from('focus_tasks')
        .update({ 
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(!currentStatus ? t('tasks.markedComplete') : t('tasks.markedIncomplete'));
      onRefresh();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error(t('errors.failedToUpdate'));
    } finally {
      setUpdating(null);
    }
  };

  const incompleteTasks = tasks.filter(t => !t.is_completed).slice(0, 5);

  return (
    <DashboardWidgetCard 
      title={t('dashboard.todaysTasks')}
      icon={CheckSquare}
      badge={incompleteTasks.length}
    >
      {incompleteTasks.length > 0 ? (
        <div className="space-y-2">
          {incompleteTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/40 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <button
                onClick={() => handleToggleTask(task.id, task.is_completed)}
                disabled={updating === task.id}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 ring-primary/20 rounded transition-all"
              >
                {task.is_completed ? (
                  <CheckSquare className="h-5 w-5 text-success" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </button>
              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-sm font-medium leading-tight mb-1 ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.priority_quadrant && (
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                    task.priority_quadrant === 'urgent_important' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                    task.priority_quadrant === 'not_urgent_important' ? 'bg-primary/10 text-primary border border-primary/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {task.priority_quadrant.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
            </div>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/tasks')}
            className={`w-full mt-2 hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <CheckSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-2">
            {t('dashboard.noTasksToday')}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
            Get started by creating your first task
          </p>
          <Button 
            size="sm" 
            onClick={() => navigate('/tasks')}
            className="shadow-sm hover:shadow-md transition-all"
          >
            {t('dashboard.addTask')}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
