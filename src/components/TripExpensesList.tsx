import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ExpenseCard from "@/components/ExpenseCard";
import { EnhancedEmptyState } from "@/components/EnhancedEmptyState";
import { Receipt } from "lucide-react";

interface TripExpensesListProps {
  tripId: string;
}

export const TripExpensesList = ({ tripId }: TripExpensesListProps) => {
  const { t } = useTranslation();

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
    <div className="space-y-6">
      {expenseGroups.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.expenses?.map((expense: any) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
