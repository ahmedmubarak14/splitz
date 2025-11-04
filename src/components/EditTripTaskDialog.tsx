import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface EditTripTaskDialogProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTripTaskDialog = ({ task, open, onOpenChange }: EditTripTaskDialogProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState<string | undefined>(task.assigned_to || undefined);
  const [assignedToGroup, setAssignedToGroup] = useState(task.assigned_to_group || false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setStatus(task.status);
    setAssignedTo(task.assigned_to || undefined);
    setAssignedToGroup(task.assigned_to_group || false);
    setDueDate(task.due_date ? new Date(task.due_date) : undefined);
  }, [task]);

  const { data: members } = useQuery({
    queryKey: ["trip-members", task.trip_id],
    queryFn: async () => {
      const { data: tripMembers, error } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", task.trip_id);

      if (error) throw error;
      if (!tripMembers || tripMembers.length === 0) return [];

      // Use security definer function to get public profiles
      const userIds = tripMembers.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase.rpc(
        'get_public_profiles',
        { _user_ids: userIds }
      );

      if (profilesError) throw profilesError;

      return tripMembers.map(member => ({
        user_id: member.user_id,
        full_name: profiles?.find((p: any) => p.id === member.user_id)?.full_name || 'Unknown User'
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Map priority to priority_quadrant enum or set to null
      const priorityQuadrantMap: Record<string, string | null> = {
        'high': 'urgent_important',
        'medium': 'not_urgent_important', 
        'low': 'not_urgent_not_important'
      };

      const { error } = await supabase.from("trip_tasks").update({
        title,
        description: description || null,
        priority_quadrant: priority ? priorityQuadrantMap[priority] : null,
        status,
        assigned_to: assignedToGroup ? null : (assignedTo === "unassigned" || !assignedTo ? null : assignedTo),
        assigned_to_group: assignedToGroup,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      }).eq("id", task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["trip"] });
      toast.success(t('trips.taskUpdated'));
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('errors.updateFailed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('trips.taskTitleRequired'));
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('trips.editTask')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('trips.taskTitle')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('trips.taskDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('trips.priority.label')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('trips.priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('trips.priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('trips.priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('trips.status.label')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t('trips.status.todo')}</SelectItem>
                  <SelectItem value="in_progress">{t('trips.status.in_progress')}</SelectItem>
                  <SelectItem value="done">{t('trips.status.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trips.dueDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {dueDate ? format(dueDate, 'PPP') : t('trips.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="assign-group">{t('trips.assignToEveryone')}</Label>
            <Switch
              id="assign-group"
              checked={assignedToGroup}
              onCheckedChange={setAssignedToGroup}
            />
          </div>

          {!assignedToGroup && (
            <div className="space-y-2">
              <Label>{t('trips.assignTo')}</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder={t('trips.selectMember')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('trips.unassigned')}</SelectItem>
                  {members?.map((member: any) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.updating') : t('common.update')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
