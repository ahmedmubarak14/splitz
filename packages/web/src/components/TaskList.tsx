import { memo, useCallback } from 'react';
import TaskItem from './TaskItem';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './EmptyState';
import { ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
}

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskComplete: (taskId: string) => void;
}

const TaskList = memo(({ tasks, isLoading, onTaskComplete }: TaskListProps) => {
  const { t } = useTranslation();
  
  const handleTaskComplete = useCallback((taskId: string) => {
    onTaskComplete(taskId);
  }, [onTaskComplete]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="Add your first task to get started"
      />
    );
  }

  const incompleteTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  return (
    <div className="space-y-6">
      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div className="space-y-2">
          {incompleteTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-2">
            {t('tasks.completed')} ({completedTasks.length})
          </h3>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TaskList.displayName = 'TaskList';

export default TaskList;
