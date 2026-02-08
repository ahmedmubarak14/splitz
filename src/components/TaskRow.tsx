import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Play, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority_quadrant?: string | null;
  due_date?: string | null;
  total_time_spent?: number;
  estimated_pomodoros?: number;
  completed_pomodoros?: number;
  project?: string;
  icon?: string | null;
}

interface TaskRowProps {
  task: Task;
  onComplete: () => void;
}

const TaskRow = memo(({ task, onComplete }: TaskRowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toggleComplete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('focus_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      onComplete();
      toast.success(
        task.is_completed ? t('toasts.tasks.reopened') : t('toasts.tasks.completed')
      );
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('focus_tasks')
        .delete()
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      toast.success(t('toasts.tasks.deleted'));
    },
  });

  const handleToggle = useCallback(() => {
    toggleComplete.mutate();
  }, []);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        task.is_completed && 'opacity-50'
      )}
    >
      {/* Circle checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
          task.is_completed
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/40 hover:border-primary'
        )}
      >
        {task.is_completed && (
          <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Task title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium truncate',
          task.is_completed && 'line-through text-muted-foreground'
        )}
      >
        {task.title}
      </span>

      {/* Actions - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigate(`/focus?task=${task.id}`)}
        >
          <Play className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive/70 hover:text-destructive"
          onClick={() => deleteTask.mutate()}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';

export default TaskRow;
