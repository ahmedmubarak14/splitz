import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

type ExpenseWithDetails = Tables<'expenses'> & {
  member_count?: number;
  total_owed?: number;
  total_received?: number;
  settled_count?: number;
  is_creator?: boolean;
};

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onViewDetails?: (id: string) => void;
  onAddExpense?: (id: string) => void;
}

const ExpenseCard = ({ expense, onViewDetails, onAddExpense }: ExpenseCardProps) => {
  const { t } = useTranslation();

  const totalOwed = expense.total_owed || 0;
  const totalReceived = expense.total_received || 0;
  const netBalance = totalReceived - totalOwed;
  const allSettled = expense.settled_count === expense.member_count;

  return (
    <Card className="shadow-card border-2 hover:border-primary card-hover overflow-hidden">
      <div className={`h-2 ${allSettled ? 'bg-success' : 'gradient-secondary'}`}></div>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-foreground" />
              </div>
              <Badge variant={allSettled ? "default" : "secondary"}>
                {allSettled ? 'Settled' : 'Active'}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-1">{expense.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Total: SAR {Number(expense.total_amount || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Members
            </div>
            <div className="text-lg font-bold">{expense.member_count || 0}</div>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Created
            </div>
            <div className="text-sm font-bold">
              {new Date(expense.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`p-3 rounded-xl border-2 ${
          netBalance > 0 
            ? 'bg-success/10 border-success/20' 
            : netBalance < 0
            ? 'bg-destructive/10 border-destructive/20'
            : 'bg-primary/10 border-primary/20'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <TrendingUp className="w-4 h-4" />
            Your Balance
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {netBalance > 0 && '+'}
              SAR {Math.abs(netBalance).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {netBalance > 0 ? 'You receive' : netBalance < 0 ? 'You owe' : 'Settled'}
            </div>
          </div>
        </div>

        {/* Settlement progress */}
        {!allSettled && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Settlement Progress</span>
              <span>{expense.settled_count || 0} / {expense.member_count || 0}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ 
                  width: `${((expense.settled_count || 0) / (expense.member_count || 1)) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onViewDetails?.(expense.id)}
            className="flex-1"
            variant="gradient"
          >
            View Details
          </Button>
          {expense.is_creator && (
            <Button
              onClick={() => onAddExpense?.(expense.id)}
              variant="outline"
            >
              Add Expense
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
