import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Clock, Calendar, Trash2, Edit, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
}

interface TaskItemProps {
  task: Task;
  onComplete: () => void;
}

const QUADRANT_CONFIG = {
  urgent_important: { label: 'Do First', emoji: '🔥', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  not_urgent_important: { label: 'Schedule', emoji: '⏰', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  urgent_unimportant: { label: 'Delegate', emoji: '👥', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  not_urgent_unimportant: { label: 'Eliminate', emoji: '🗑️', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
};

const TaskItem = ({ task, onComplete }: TaskItemProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);

  const toggleComplete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('focus_tasks')
        .update({ 
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      onComplete();
      toast.success(task.is_completed ? 'Task reopened' : 'Task completed!');
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
      toast.success('Task deleted');
    },
  });

  const quadrantConfig = task.priority_quadrant ? QUADRANT_CONFIG[task.priority_quadrant as keyof typeof QUADRANT_CONFIG] : null;
  const totalMinutes = task.total_time_spent || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <Card className={cn(
      'p-3 md:p-4 transition-all hover:shadow-md active:scale-[0.98]',
      task.is_completed && 'opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={() => toggleComplete.mutate()}
          className="mt-1 h-5 w-5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              'font-medium',
              task.is_completed && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate(`/focus?task=${task.id}`)}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {quadrantConfig && (
              <Badge variant="outline" className={cn(quadrantConfig.color, 'text-xs')}>
                <span className="mr-1">{quadrantConfig.emoji}</span>
                {quadrantConfig.label}
              </Badge>
            )}

            {task.due_date && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(task.due_date), 'MMM d')}
              </Badge>
            )}

            {totalMinutes > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
              </Badge>
            )}

            {task.estimated_pomodoros && (
              <Badge variant="secondary" className="text-xs">
                {task.completed_pomodoros || 0}/{task.estimated_pomodoros} 🍅
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => deleteTask.mutate()}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskItem;
