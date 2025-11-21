import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { TripTaskCard } from "./TripTaskCard";
import { EmptyState } from "./EmptyState";
import { CheckSquare } from "lucide-react";

interface TripTaskListProps {
  tripId: string;
}

export const TripTaskList = ({ tripId }: TripTaskListProps) => {
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["trip-tasks", tripId],
    queryFn: async () => {
      // Fetch trip tasks
      const { data: taskData, error } = await supabase
        .from("trip_tasks")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }

      if (!taskData || taskData.length === 0) return [];

      // Collect unique user IDs
      const userIds = new Set<string>();
      taskData.forEach(task => {
        if (task.assigned_to) userIds.add(task.assigned_to);
        if (task.created_by) userIds.add(task.created_by);
      });

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(userIds));

      // Create a map of profiles
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge tasks with their related profiles
      return taskData.map(task => ({
        ...task,
        assigned_user: task.assigned_to ? profileMap.get(task.assigned_to) : null,
        creator: task.created_by ? profileMap.get(task.created_by) : null
      }));
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title={t('trips.noTasks')}
        description={t('trips.noTasksDescription')}
      />
    );
  }

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        statusTasks.length > 0 && (
          <div key={status} className="space-y-3">
            <h3 className="font-semibold capitalize flex items-center gap-2">
              {t(`trips.status.${status}`)}
              <span className="text-sm text-muted-foreground">({statusTasks.length})</span>
            </h3>
            <div className="space-y-2">
              {statusTasks.map((task) => (
                <TripTaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
};
