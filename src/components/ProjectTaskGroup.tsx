import { memo, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import TaskRow from './TaskRow';

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

interface ProjectTaskGroupProps {
  projectName: string;
  emoji: string;
  tasks: Task[];
  defaultOpen?: boolean;
  onTaskComplete: () => void;
}

const ProjectTaskGroup = memo(({ projectName, emoji, tasks, defaultOpen = true, onTaskComplete }: ProjectTaskGroupProps) => {
  const storageKey = `project-group-${projectName}`;
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? JSON.parse(saved) : defaultOpen;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isOpen));
  }, [isOpen, storageKey]);

  const incompleteTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const allTasks = [...incompleteTasks, ...completedTasks];

  return (
    <div className="rounded-xl border border-border/40 bg-card/80 overflow-hidden">
      {/* Project Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{emoji}</span>
          <h3 className="text-sm font-semibold">{projectName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
            {incompleteTasks.length}
          </Badge>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              !isOpen && '-rotate-90'
            )}
          />
        </div>
      </button>

      {/* Tasks */}
      {isOpen && allTasks.length > 0 && (
        <div className="border-t border-border/30 py-1">
          {allTasks.map(task => (
            <TaskRow key={task.id} task={task} onComplete={onTaskComplete} />
          ))}
        </div>
      )}
    </div>
  );
});

ProjectTaskGroup.displayName = 'ProjectTaskGroup';

export default ProjectTaskGroup;
