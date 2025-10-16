import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority_quadrant?: string | null;
  total_time_spent?: number;
  due_date?: string | null;
  is_completed?: boolean;
}

interface EisenhowerMatrixProps {
  tasks: Task[];
  isLoading: boolean;
  onMoveTask: (taskId: string, quadrant: string | null) => void;
}

const QUADRANTS = [
  {
    id: 'urgent_important',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'border-red-500/50 bg-red-500/5',
    headerColor: 'bg-red-500/10 text-red-700 dark:text-red-400',
  },
  {
    id: 'not_urgent_important',
    title: 'Schedule',
    subtitle: 'Not Urgent & Important',
    color: 'border-orange-500/50 bg-orange-500/5',
    headerColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  },
  {
    id: 'urgent_unimportant',
    title: 'Delegate',
    subtitle: 'Urgent & Not Important',
    color: 'border-blue-500/50 bg-blue-500/5',
    headerColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  {
    id: 'not_urgent_unimportant',
    title: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    color: 'border-green-500/50 bg-green-500/5',
    headerColor: 'bg-green-500/10 text-green-700 dark:text-green-400',
  },
];

const EisenhowerMatrix = ({ tasks, isLoading, onMoveTask }: EisenhowerMatrixProps) => {
  const isMobile = useIsMobile();

  const getTasksByQuadrant = (quadrantId: string) => {
    return tasks.filter(t => t.priority_quadrant === quadrantId && !t.is_completed);
  };

  const unassignedTasks = tasks.filter(t => !t.priority_quadrant && !t.is_completed);

  const QuadrantCard = ({ quadrant }: { quadrant: typeof QUADRANTS[0] }) => {
    const quadrantTasks = getTasksByQuadrant(quadrant.id);

    return (
      <Card className={cn('p-4 h-full min-h-[300px] flex flex-col', quadrant.color)}>
        <div className={cn('rounded-lg p-3 mb-4', quadrant.headerColor)}>
          <h3 className="font-bold text-lg">{quadrant.title}</h3>
          <p className="text-xs opacity-80">{quadrant.subtitle}</p>
          <Badge variant="secondary" className="mt-2">
            {quadrantTasks.length} tasks
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {quadrantTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks in this quadrant
            </p>
          ) : (
            quadrantTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={(newQuadrant) => onMoveTask(task.id, newQuadrant)}
              />
            ))
          )}
        </div>
      </Card>
    );
  };

  const TaskCard = ({ task, onMove }: { task: Task; onMove: (quadrant: string | null) => void }) => {
    const totalMinutes = task.total_time_spent || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return (
      <Card className="p-3 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            {totalMinutes > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {QUADRANTS.map((q) => (
                <DropdownMenuItem
                  key={q.id}
                  onClick={() => onMove(q.id)}
                  disabled={task.priority_quadrant === q.id}
                >
                  Move to {q.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => onMove(null)}>
                Remove from matrix
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Unassigned Tasks */}
      {unassignedTasks.length > 0 && (
        <Card className="p-4 border-dashed">
          <h3 className="font-semibold mb-3">Unassigned Tasks ({unassignedTasks.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {unassignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={(quadrant) => onMoveTask(task.id, quadrant)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Matrix Grid */}
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-1' : 'grid-cols-2'
      )}>
        {QUADRANTS.map((quadrant) => (
          <QuadrantCard key={quadrant.id} quadrant={quadrant} />
        ))}
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
