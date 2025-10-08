import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Edit, Trash2, Plus, Eye, Filter, Receipt, History, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import * as React from 'react';
import { formatDateShort } from '@/lib/timezone';
import { GroupBalanceDetails } from '@/components/GroupBalanceDetails';
import ExpenseHistory from '@/components/ExpenseHistory';
import ExpenseAnalytics from '@/components/ExpenseAnalytics';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';

interface Expense {
  id: string;
  name: string;
  total_amount: number;
  paid_by: string;
  paid_by_name: string;
  created_at: string;
  category?: string;
}

interface ExpenseGroupDetailsDialogProps {
  group: {
    id: string;
    name: string;
    total_expenses: number;
    net_balance: number;
    simplified_debts?: Array<{
      from_user_id: string;
      to_user_id: string;
      from_name: string;
      to_name: string;
      amount: number;
    }>;
  } | null;
  expenses: Expense[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onViewExpenseDetails?: (expense: any) => void;
  onRecordPayment?: (fromUserId: string, toUserId: string, amount: number) => void;
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
  onViewExpenseDetails,
  onRecordPayment,
  currentUserId,
}: ExpenseGroupDetailsDialogProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📂' },
    { value: 'food', label: 'Food', icon: '🍔' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'utilities', label: 'Utilities', icon: '⚡' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'health', label: 'Health', icon: '💊' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📦' },
  ];

  const filteredExpenses = categoryFilter === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === categoryFilter);

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

            {/* Simplified Debts - Now using GroupBalanceDetails component */}
            {group.simplified_debts && group.simplified_debts.length > 0 && (
              <GroupBalanceDetails
                groupId={group.id}
                currentUserId={currentUserId}
                debts={group.simplified_debts}
                onRecordPayment={onRecordPayment}
              />
            )}

            {/* Tabs for Expenses, History, and Analytics */}
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TabsTrigger value="expenses" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Receipt className="h-4 w-4" />
                  {t('expenses.expenses')}
                </TabsTrigger>
                <TabsTrigger value="history" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <History className="h-4 w-4" />
                  {t('expenses.history')}
                </TabsTrigger>
                <TabsTrigger value="analytics" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <BarChart3 className="h-4 w-4" />
                  {t('expenses.analytics')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses" className="mt-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Expenses</h3>
                    <div className="flex items-center gap-2">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] h-9 bg-background">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={onAddExpense} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {filteredExpenses.length === 0 ? (
                    <Card className="p-8 border border-border text-center">
                      <p className="text-muted-foreground">
                        {categoryFilter === 'all' ? 'No expenses yet' : 'No expenses in this category'}
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredExpenses.map((expense: any) => {
                        const isCreator = expense.user_id === currentUserId;
                        return (
                          <Card key={expense.id} className="p-3 border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{expense.name}</p>
                                  {expense.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                      {categories.find(c => c.value === expense.category)?.icon} {expense.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Paid by {expense.paid_by_name} • {formatDateShort(expense.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg mr-2">
                                  {Number(expense.total_amount).toFixed(2)} SAR
                                </span>
                                {onViewExpenseDetails && (
                                  <Button
                                    onClick={() => onViewExpenseDetails(expense)}
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                {isCreator && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <ExpenseHistory expenses={expenses} groupId={group.id} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                <ExpenseAnalytics expenses={expenses} />
              </TabsContent>
            </Tabs>
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
