import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, Play, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority_quadrant?: string | null;
  due_date?: string | null;
  total_time_spent?: number;
  project?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  isLoading: boolean;
  onAddTask: () => void;
}

const COLUMNS = [
  { id: 'todo', color: 'border-t-blue-500' },
  { id: 'in_progress', color: 'border-t-amber-500' },
  { id: 'done', color: 'border-t-emerald-500' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

const KanbanBoard = memo(({ tasks, isLoading, onAddTask }: KanbanBoardProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const columns = useMemo(() => {
    const todo = tasks.filter(t => !t.is_completed && !t.priority_quadrant);
    const inProgress = tasks.filter(t => !t.is_completed && t.priority_quadrant);
    const done = tasks.filter(t => t.is_completed);

    return {
      todo,
      in_progress: inProgress,
      done,
    };
  }, [tasks]);

  const toggleComplete = useMutation({
    mutationFn: async (task: Task) => {
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
    },
  });

  const moveToInProgress = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('focus_tasks')
        .update({ priority_quadrant: 'urgent_important' as any })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      toast.success(t('tasks.kanban.movedToInProgress'));
    },
  });

  const moveToTodo = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('focus_tasks')
        .update({ 
          priority_quadrant: null,
          is_completed: false,
          completed_at: null
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
    },
  });

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
      {COLUMNS.map(col => {
        const columnTasks = columns[col.id as ColumnId];
        return (
          <div
            key={col.id}
            className={cn(
              'rounded-xl border border-border/50 bg-muted/20 min-h-[300px] flex flex-col',
              'border-t-4',
              col.color
            )}
          >
            {/* Column Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{t(`tasks.kanban.${col.id}`)}</h3>
                <Badge variant="secondary" className="text-xs px-1.5">
                  {columnTasks.length}
                </Badge>
              </div>
              {col.id === 'todo' && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddTask}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Column Cards */}
            <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  {t('tasks.kanban.empty')}
                </div>
              ) : (
                columnTasks.map(task => (
                  <Card
                    key={task.id}
                    className={cn(
                      'p-3 bg-card hover:shadow-md transition-all cursor-default group',
                      task.is_completed && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          task.is_completed && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            📅 {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.id === 'todo' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => moveToInProgress.mutate(task.id)}
                        >
                          {t('tasks.kanban.start')}
                        </Button>
                      )}
                      {col.id === 'in_progress' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => toggleComplete.mutate(task)}
                          >
                            ✓ {t('tasks.kanban.complete')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => navigate(`/focus?task=${task.id}`)}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {col.id === 'done' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => moveToTodo.mutate(task.id)}
                        >
                          {t('tasks.kanban.reopen')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

KanbanBoard.displayName = 'KanbanBoard';

export default KanbanBoard;
