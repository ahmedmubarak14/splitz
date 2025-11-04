import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ExpenseCard from "@/components/ExpenseCard";
import { EnhancedEmptyState } from "@/components/EnhancedEmptyState";
import { Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/components/CreateExpenseDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";

interface TripExpensesListProps {
  tripId: string;
}

export const TripExpensesList = ({ tripId }: TripExpensesListProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<Array<{ id: string; name: string }>>([]);

  const { data: expenseGroups, isLoading } = useQuery({
    queryKey: ["trip-expense-groups", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_groups")
        .select(`
          id,
          name,
          created_at,
          created_by,
          expenses (
            id,
            name,
            total_amount,
            category,
            created_at,
            paid_by,
            user_id,
            expense_members (
              id,
              user_id,
              amount_owed,
              is_settled
            )
          )
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

  const handleAddExpense = async (groupId: string) => {
    setSelectedGroupId(groupId);
    await fetchGroupMembers(groupId);
    setCreateExpenseOpen(true);
  };

  const handleEditExpense = async (expense: any, groupId: string) => {
    setSelectedExpense(expense);
    await fetchGroupMembers(groupId);
    setEditExpenseOpen(true);
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: members } = await supabase
        .from('expense_group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!members || members.length === 0) return;

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase.rpc(
        'get_public_profiles',
        { _user_ids: userIds }
      );

      const membersWithNames = members.map(member => ({
        id: member.user_id,
        name: profiles?.find((p: any) => p.id === member.user_id)?.full_name || 'Unknown User'
      }));

      setGroupMembers(membersWithNames);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleUpdateExpense = async (id: string, name: string, amount: number, paidBy: string, category: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          name,
          total_amount: amount,
          paid_by: paidBy,
          category: category as any,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('trips.expenses.expenseUpdated'));
      setEditExpenseOpen(false);
      queryClient.invalidateQueries({ queryKey: ["trip-expense-groups"] });
      queryClient.invalidateQueries({ queryKey: ["trip-expense-summary"] });
    } catch (error) {
      toast.error(t('errors.updateFailed'));
    }
  };

  const handleExpenseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["trip-expense-groups"] });
    queryClient.invalidateQueries({ queryKey: ["trip-expense-summary"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!expenseGroups || expenseGroups.length === 0) {
    return (
      <EnhancedEmptyState
        icon={Receipt}
        emoji="💰"
        title={t('trips.expenses.noExpenses')}
        description={t('trips.expenses.noExpensesDesc')}
        tips={[
          t('trips.expenses.tip1'),
          t('trips.expenses.tip2'),
          t('trips.expenses.tip3')
        ]}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {expenseGroups.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <Button
                size="sm"
                onClick={() => handleAddExpense(group.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('trips.expenses.addExpense')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.expenses && group.expenses.length > 0 ? (
                group.expenses.map((expense: any) => (
                  <div key={expense.id} className="relative group">
                    <ExpenseCard expense={expense} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEditExpense(expense, group.id)}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                  {t('trips.expenses.noExpenses')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedGroupId && (
        <CreateExpenseDialog
          groupId={selectedGroupId}
          open={createExpenseOpen}
          onOpenChange={setCreateExpenseOpen}
          onSuccess={handleExpenseSuccess}
        />
      )}

      <EditExpenseDialog
        expense={selectedExpense}
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        onSave={handleUpdateExpense}
        groupMembers={groupMembers}
      />
    </>
  );
};
