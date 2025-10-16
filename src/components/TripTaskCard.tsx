import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MoreVertical, User } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditTripTaskDialog } from "./EditTripTaskDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TripTaskCardProps {
  task: any;
}

export const TripTaskCard = ({ task }: TripTaskCardProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("trip_tasks")
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["trip"] });
      toast.success(t('trips.taskUpdated'));
    },
    onError: () => {
      toast.error(t('errors.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trip_tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["trip"] });
      toast.success(t('trips.taskDeleted'));
    },
    onError: () => {
      toast.error(t('errors.deleteFailed'));
    },
  });

  const handleCheckChange = (checked: boolean) => {
    updateStatusMutation.mutate(checked ? 'done' : 'todo');
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <>
      <Card className="p-4">
        <div className={`flex items-start gap-3 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={handleCheckChange}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className={`flex items-start justify-between gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteMutation.mutate()}
                    className="text-destructive"
                  >
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}

            <div className={`flex flex-wrap items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
              <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {t(`trips.priority.${task.priority}`)}
              </Badge>

              {task.due_date && (
                <div className={`flex items-center gap-1 text-sm text-muted-foreground ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}

              {task.assigned_user ? (
                <div className={`flex items-center gap-2 ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assigned_user.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {task.assigned_user.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {task.assigned_user.full_name}
                  </span>
                </div>
              ) : task.assigned_to_group ? (
                <div className={`flex items-center gap-1 text-sm text-muted-foreground ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
                  <User className="h-3 w-3" />
                  <span>{t('trips.everyone')}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <EditTripTaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
};
