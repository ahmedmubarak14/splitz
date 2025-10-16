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
      title={t('dashboard.todaysTasks') || "Today's Tasks"}
      icon={CheckSquare}
      badge={incompleteTasks.length}
    >
      {incompleteTasks.length > 0 ? (
        <div className="space-y-2">
          {incompleteTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <button
                onClick={() => handleToggleTask(task.id, task.is_completed)}
                disabled={updating === task.id}
                className="flex-shrink-0"
              >
                {task.is_completed ? (
                  <CheckSquare className="h-5 w-5 text-success" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                )}
              </button>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.priority_quadrant && (
                  <span className={`text-xs ${
                    task.priority_quadrant === 'urgent_important' ? 'text-destructive' :
                    task.priority_quadrant === 'not_urgent_important' ? 'text-primary' :
                    'text-muted-foreground'
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
            className={`w-full mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll') || 'View All'}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className={`text-center py-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-muted-foreground mb-2">
            {t('dashboard.noTasksToday') || "All caught up! 🎉"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/tasks')}
          >
            {t('dashboard.addTask') || 'Add Task'}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
