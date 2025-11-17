import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { DollarSign, Users, TrendingUp } from "lucide-react";

interface TripExpenseSummaryProps {
  tripId: string;
}

export const TripExpenseSummary = ({ tripId }: TripExpenseSummaryProps) => {
  const { t } = useTranslation();

  const { data: summary } = useQuery({
    queryKey: ["trip-expense-summary", tripId],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from("expense_groups")
        .select(`
          id,
          expenses (
            id,
            total_amount,
            expense_members (
              id,
              user_id,
              is_settled
            )
          )
        `)
        .eq("trip_id", tripId);

      if (error) throw error;

      let totalSpent = 0;
      let totalSettled = 0;
      let totalPending = 0;
      const uniqueMembers = new Set<string>();

      groups?.forEach(group => {
        group.expenses?.forEach((expense: any) => {
          totalSpent += Number(expense.total_amount) || 0;
          
          expense.expense_members?.forEach((member: any) => {
            uniqueMembers.add(member.user_id);
            if (member.is_settled) {
              totalSettled += Number(expense.total_amount) / expense.expense_members.length;
            } else {
              totalPending += Number(expense.total_amount) / expense.expense_members.length;
            }
          });
        });
      });

      const avgPerPerson = uniqueMembers.size > 0 ? totalSpent / uniqueMembers.size : 0;

      return {
        totalSpent,
        avgPerPerson,
        memberCount: uniqueMembers.size,
        settledAmount: totalSettled,
        pendingAmount: totalPending,
      };
    },
  });

  if (!summary || summary.totalSpent === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('trips.expenses.totalSpent')}</p>
            <p className="text-2xl font-bold">SAR {summary.totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('trips.expenses.avgPerPerson')}</p>
            <p className="text-2xl font-bold">SAR {summary.avgPerPerson.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('trips.expenses.pending')}</p>
            <p className="text-2xl font-bold">SAR {summary.pendingAmount.toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
