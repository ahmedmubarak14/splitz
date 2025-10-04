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
    <Card className="border border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{expense.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total: SAR {Number(expense.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <Badge variant={allSettled ? "default" : "secondary"} className="text-xs">
            {allSettled ? 'Settled' : 'Active'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Members
            </div>
            <div className="text-base font-semibold">{expense.member_count || 0}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Created
            </div>
            <div className="text-xs font-semibold">
              {new Date(expense.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`p-3 rounded-lg border ${
          netBalance > 0 
            ? 'bg-success/10 border-success/30' 
            : netBalance < 0
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-accent border-border'
        }`}>
          <div className="flex items-center gap-2 text-xs font-medium mb-1">
            <TrendingUp className="w-3 h-3" />
            Your Balance
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {netBalance > 0 && '+'}
              SAR {Math.abs(netBalance).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {netBalance > 0 ? 'You receive' : netBalance < 0 ? 'You owe' : 'Settled'}
            </div>
          </div>
        </div>

        {/* Settlement progress */}
        {!allSettled && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Settlement</span>
              <span>{expense.settled_count || 0} / {expense.member_count || 0}</span>
            </div>
            <div className="h-1.5 bg-accent rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
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
            size="sm"
          >
            View Details
          </Button>
          {expense.is_creator && (
            <Button
              onClick={() => onAddExpense?.(expense.id)}
              variant="outline"
              size="sm"
            >
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
