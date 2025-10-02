import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

type ExpenseMember = {
  id: string;
  user_id: string;
  amount_owed: number;
  is_settled: boolean;
  user_name?: string;
};

type ExpenseWithDetails = Tables<'expenses'> & {
  members?: ExpenseMember[];
  is_creator?: boolean;
};

interface ExpenseDetailsDialogProps {
  expense: ExpenseWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleSettlement?: (memberId: string, currentStatus: boolean) => void;
}

const ExpenseDetailsDialog = ({ 
  expense, 
  open, 
  onOpenChange,
  onToggleSettlement
}: ExpenseDetailsDialogProps) => {
  const { t } = useTranslation();

  if (!expense) return null;

  const totalSettled = expense.members?.filter(m => m.is_settled).length || 0;
  const allSettled = totalSettled === (expense.members?.length || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl gradient-secondary flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{expense.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={allSettled ? "default" : "secondary"}>
                  {allSettled ? 'All Settled' : 'Active'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  SAR {Number(expense.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Expense Info */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  Total Amount
                </div>
                <div className="font-bold text-lg">
                  SAR {Number(expense.total_amount).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  Members
                </div>
                <div className="font-bold text-lg">
                  {expense.members?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Created
                </div>
                <div className="font-bold text-sm">
                  {new Date(expense.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settlement Progress */}
          <Card className={`border-2 ${allSettled ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className={`w-5 h-5 ${allSettled ? 'text-success' : 'text-primary'}`} />
                  Settlement Progress
                </div>
                <span className="text-sm font-medium">
                  {totalSettled} / {expense.members?.length || 0} settled
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${allSettled ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${((totalSettled) / (expense.members?.length || 1)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Members & Amounts
            </h3>
            <div className="space-y-2">
              {expense.members && expense.members.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No members yet
                  </CardContent>
                </Card>
              ) : (
                expense.members?.map((member) => (
                  <Card 
                    key={member.id}
                    className={member.is_settled ? 'border-2 border-success/30 bg-success/5' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          member.is_settled 
                            ? 'bg-success text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {member.is_settled ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {member.user_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.is_settled ? 'Settled' : 'Pending'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            SAR {Number(member.amount_owed).toFixed(2)}
                          </div>
                        </div>
                        {expense.is_creator && (
                          <Button
                            size="sm"
                            variant={member.is_settled ? "outline" : "default"}
                            onClick={() => onToggleSettlement?.(member.id, member.is_settled)}
                          >
                            {member.is_settled ? 'Mark Unpaid' : 'Mark Paid'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="gradient"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsDialog;
