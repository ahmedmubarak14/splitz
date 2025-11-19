import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreateExpenseDialog } from "@/components/CreateExpenseDialog";

interface CreateTripExpenseDialogProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTripExpenseDialog = ({ tripId, open, onOpenChange }: CreateTripExpenseDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First create the expense group
      const { data: groupData, error: groupError } = await supabase
        .from("expense_groups")
        .insert({
          name: groupName,
          trip_id: tripId,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add all trip members to the expense group
      const { data: tripMembers } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId);

      if (tripMembers && tripMembers.length > 0) {
        const membersToAdd = tripMembers.map(m => ({
          group_id: groupData.id,
          user_id: m.user_id,
        }));

        await supabase
          .from("expense_group_members")
          .insert(membersToAdd);
      }

      return groupData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trip-expense-groups", tripId] });
      toast.success(t('trips.expenses.groupCreated'));
      setCreatedGroupId(data.id);
      setShowExpenseForm(true);
    },
    onError: (error: any) => {
      console.error('Create group error:', error);
      const message = error?.message || t('errors.createFailed');
      toast.error(message);
    },
  });

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error(t('trips.expenses.groupNameRequired'));
      return;
    }
    createGroupMutation.mutate();
  };

  const handleExpenseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["trip-expense-groups", tripId] });
    queryClient.invalidateQueries({ queryKey: ["trip-expense-summary", tripId] });
    setGroupName("");
    setCreatedGroupId(null);
    setShowExpenseForm(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setGroupName("");
    setCreatedGroupId(null);
    setShowExpenseForm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showExpenseForm} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('trips.expenses.createExpenseGroup')}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">{t('trips.expenses.groupName')} *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('trips.expenses.groupNamePlaceholder')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('trips.expenses.groupNameHelp')}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createGroupMutation.isPending}>
                {createGroupMutation.isPending ? t('common.creating') : t('common.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {createdGroupId && (
        <CreateExpenseDialog
          groupId={createdGroupId}
          open={showExpenseForm}
          onOpenChange={(open) => {
            if (!open) {
              handleExpenseSuccess();
            }
          }}
          onSuccess={handleExpenseSuccess}
        />
      )}
    </>
  );
};
