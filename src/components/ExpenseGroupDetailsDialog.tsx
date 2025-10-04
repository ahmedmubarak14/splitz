import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Edit, Trash2, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import * as React from 'react';

interface Expense {
  id: string;
  name: string;
  total_amount: number;
  paid_by: string;
  paid_by_name: string;
  created_at: string;
}

interface ExpenseGroupDetailsDialogProps {
  group: {
    id: string;
    name: string;
    total_expenses: number;
    net_balance: number;
    settlement_summary?: Array<{
      from: string;
      to: string;
      amount: number;
    }>;
  } | null;
  expenses: Expense[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  currentUserId: string;
}

const ExpenseGroupDetailsDialog = ({
  group,
  expenses,
  open,
  onOpenChange,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpenseGroupDetailsDialogProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null);

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{group.name}</DialogTitle>
            <DialogDescription className="text-base">
              Expense group details and settlement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-semibold">{group.total_expenses.toFixed(2)} SAR</p>
              </Card>
              <Card className="p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                <p className={`text-2xl font-semibold ${group.net_balance > 0 ? 'text-success' : group.net_balance < 0 ? 'text-destructive' : ''}`}>
                  {group.net_balance > 0 ? '+' : ''}{group.net_balance.toFixed(2)} SAR
                </p>
              </Card>
            </div>

            {/* Settlement Summary */}
            {group.settlement_summary && group.settlement_summary.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Who Owes Whom</h3>
                <div className="space-y-2">
                  {group.settlement_summary.map((settlement, idx) => (
                    <Card key={idx} className="p-3 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{settlement.from}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{settlement.to}</span>
                        </div>
                        <span className="font-semibold text-lg">{settlement.amount.toFixed(2)} SAR</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Expenses</h3>
                <Button onClick={onAddExpense} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {expenses.length === 0 ? (
                <Card className="p-8 border border-border text-center">
                  <p className="text-muted-foreground">No expenses yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <Card key={expense.id} className="p-3 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid by {expense.paid_by_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg mr-2">
                            {Number(expense.total_amount).toFixed(2)} SAR
                          </span>
                          <Button
                            onClick={() => onEditExpense(expense)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(expense.id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExpenseGroupDetailsDialog;
