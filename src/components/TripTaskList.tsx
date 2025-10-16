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
      const { data, error } = await supabase
        .from("trip_tasks")
        .select(`
          *,
          assigned_user:profiles!trip_tasks_assigned_to_fkey(id, full_name, avatar_url),
          creator:profiles!trip_tasks_created_by_fkey(id, full_name)
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(t('errors.failedToLoad'));
        throw error;
      }
      return data;
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
