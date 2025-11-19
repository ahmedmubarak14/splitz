import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, AlertTriangle, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BudgetManagerProps {
  currentSpending: number;
  subscriptions: any[];
}

export const BudgetManager = ({ currentSpending, subscriptions }: BudgetManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("80");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budget
  const { data: budget } = useQuery({
    queryKey: ['budget'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscription_budgets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Set budget mutation
  const setBudgetMutation = useMutation({
    mutationFn: async (budgetData: { monthly_limit: number; alert_threshold: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('subscription_budgets')
        .upsert({
          user_id: user.id,
          monthly_limit: budgetData.monthly_limit,
          alert_threshold: budgetData.alert_threshold,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({
        title: "Budget Updated",
        description: "Your monthly budget has been saved.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update budget: " + error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (budget) {
      setMonthlyLimit(budget.monthly_limit.toString());
      setAlertThreshold((budget.alert_threshold * 100).toString());
    }
  }, [budget]);

  const handleSave = () => {
    const limit = parseFloat(monthlyLimit);
    const threshold = parseFloat(alertThreshold) / 100;

    if (isNaN(limit) || limit <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid monthly budget amount.",
        variant: "destructive",
      });
      return;
    }

    setBudgetMutation.mutate({
      monthly_limit: limit,
      alert_threshold: threshold,
    });
  };

  const budgetLimit = budget?.monthly_limit || 0;
  const usagePercent = budgetLimit > 0 ? (currentSpending / budgetLimit) * 100 : 0;
  const threshold = (budget?.alert_threshold || 0.8) * 100;
  const remaining = budgetLimit - currentSpending;

  const getStatusColor = () => {
    if (usagePercent >= 100) return "text-destructive";
    if (usagePercent >= threshold) return "text-warning";
    return "text-success";
  };

  const getStatusLevel = () => {
    if (usagePercent >= 100) return "Over Budget";
    if (usagePercent >= threshold) return "Warning";
    return "On Track";
  };

  if (!budget && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Set Monthly Budget
          </CardTitle>
          <CardDescription>
            Track your subscription spending and get alerts when approaching your limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsEditing(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            Set Budget
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Monthly Budget
            </CardTitle>
            <CardDescription>
              {isEditing ? "Update your budget settings" : "Track your subscription spending"}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit">Monthly Budget Limit (SAR)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="80"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Get notified when spending reaches this percentage of your budget
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={setBudgetMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Budget
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (budget) {
                    setMonthlyLimit(budget.monthly_limit.toString());
                    setAlertThreshold((budget.alert_threshold * 100).toString());
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Budget Overview */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Spending</span>
                <Badge variant={usagePercent >= 100 ? "destructive" : "secondary"}>
                  {getStatusLevel()}
                </Badge>
              </div>
              <Progress value={Math.min(usagePercent, 100)} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className={getStatusColor() + " font-semibold"}>
                  SAR {currentSpending.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  of SAR {budgetLimit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Remaining Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  SAR {Math.abs(remaining).toFixed(2)}
                </p>
                {remaining < 0 && (
                  <p className="text-xs text-destructive">Over budget</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Usage</p>
                <p className={`text-2xl font-bold ${getStatusColor()}`}>
                  {usagePercent.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">of limit</p>
              </div>
            </div>

            {/* Warnings */}
            {usagePercent >= threshold && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Budget Alert</p>
                  <p className="text-xs text-muted-foreground">
                    {usagePercent >= 100
                      ? `You're over budget by SAR ${Math.abs(remaining).toFixed(2)}`
                      : `You've used ${usagePercent.toFixed(0)}% of your budget`}
                  </p>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {usagePercent >= 90 && subscriptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggestions to reduce spending:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {subscriptions
                    .filter((s) => s.usage_frequency === 'rarely')
                    .slice(0, 2)
                    .map((s) => (
                      <li key={s.id}>• Consider canceling "{s.name}" (rarely used)</li>
                    ))}
                  {subscriptions
                    .filter((s) => s.status === 'paused')
                    .slice(0, 2)
                    .map((s) => (
                      <li key={s.id}>• Cancel paused subscription "{s.name}"</li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};