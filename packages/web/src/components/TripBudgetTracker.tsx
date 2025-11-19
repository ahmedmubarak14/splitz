import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { DollarSign, AlertTriangle, TrendingUp, Settings } from "lucide-react";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface TripBudgetTrackerProps {
  tripId: string;
}

export const TripBudgetTracker = ({ tripId }: TripBudgetTrackerProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalBudget, setTotalBudget] = useState("");

  const { data: budget } = useQuery({
    queryKey: ["trip-budget", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_budgets")
        .select("*")
        .eq("trip_id", tripId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ["trip-expense-summary", tripId],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from("expense_groups")
        .select(`
          id,
          expenses (
            id,
            total_amount
          )
        `)
        .eq("trip_id", tripId);

      if (error) throw error;

      let totalSpent = 0;
      groups?.forEach(group => {
        group.expenses?.forEach((expense: any) => {
          totalSpent += Number(expense.total_amount) || 0;
        });
      });

      return { totalSpent };
    },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (budgetAmount: number) => {
      if (budget) {
        const { error } = await supabase
          .from("trip_budgets")
          .update({ total_budget: budgetAmount })
          .eq("trip_id", tripId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("trip_budgets")
          .insert({ trip_id: tripId, total_budget: budgetAmount });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-budget"] });
      toast.success(t('trips.budget.budgetSaved'));
      setDialogOpen(false);
      setTotalBudget("");
    },
    onError: () => {
      toast.error(t('errors.saveFailed'));
    },
  });

  const handleSaveBudget = () => {
    const amount = parseFloat(totalBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('trips.budget.invalidAmount'));
      return;
    }
    createOrUpdateMutation.mutate(amount);
  };

  const totalSpent = expenseSummary?.totalSpent || 0;
  const budgetAmount = budget?.total_budget || 0;
  const remaining = budgetAmount - totalSpent;
  const percentUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
  const isOverBudget = totalSpent > budgetAmount && budgetAmount > 0;
  const isNearLimit = percentUsed >= (budget?.alert_threshold || 0.8) * 100 && !isOverBudget;

  if (!budget && totalSpent === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold mb-2">{t('trips.budget.noBudget')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('trips.budget.setBudgetDesc')}</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>{t('trips.budget.setBudget')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('trips.budget.setBudget')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('trips.budget.totalBudget')}</Label>
                    <Input
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                  <Button onClick={handleSaveBudget} className="w-full" disabled={createOrUpdateMutation.isPending}>
                    {t('common.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className={`flex items-center justify-between ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
        <h3 className="font-semibold">{t('trips.budget.title')}</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('common.edit')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('trips.budget.updateBudget')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('trips.budget.totalBudget')}</Label>
                <Input
                  type="number"
                  value={totalBudget || budget?.total_budget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder={budget?.total_budget?.toString()}
                />
              </div>
              <Button onClick={handleSaveBudget} className="w-full" disabled={createOrUpdateMutation.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isOverBudget && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">{t('trips.budget.overBudget')}</span>
        </div>
      )}

      {isNearLimit && (
        <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-orange-600 dark:text-orange-400">{t('trips.budget.nearLimit')}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('trips.budget.budgeted')}</p>
          <p className="text-2xl font-bold">SAR {budgetAmount.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('trips.budget.spent')}</p>
          <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : ''}`}>
            SAR {totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('trips.budget.remaining')}</p>
          <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
            SAR {Math.abs(remaining).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`flex justify-between text-sm ${rtlClass(isRTL, 'flex-row-reverse', 'flex-row')}`}>
          <span className="text-muted-foreground">{t('trips.budget.progress')}</span>
          <span className="font-medium">{Math.round(percentUsed)}%</span>
        </div>
        <Progress 
          value={Math.min(percentUsed, 100)} 
          className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-orange-500' : ''}`}
        />
      </div>
    </Card>
  );
};
