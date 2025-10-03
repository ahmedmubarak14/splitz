import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import ExpenseCard from '@/components/ExpenseCard';
import ExpenseDetailsDialog from '@/components/ExpenseDetailsDialog';
import { InviteDialog } from '@/components/InviteDialog';

type ExpenseWithDetails = Tables<'expenses'> & {
  member_count?: number;
  total_owed?: number;
  total_received?: number;
  settled_count?: number;
  is_creator?: boolean;
  members?: Array<{
    id: string;
    user_id: string;
    amount_owed: number;
    is_settled: boolean;
    user_name?: string;
  }>;
};

const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null);
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
    fetchExpenses();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/auth');
  };

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      const { data: allMembers } = await supabase
        .from('expense_members')
        .select('*');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const processedExpenses: ExpenseWithDetails[] = (expensesData || [])
        .filter(expense => {
          const members = allMembers?.filter(m => m.expense_id === expense.id) || [];
          return expense.user_id === user.id || members.some(m => m.user_id === user.id);
        })
        .map((expense) => {
          const members = allMembers?.filter(m => m.expense_id === expense.id) || [];
          const isCreator = expense.user_id === user.id;
          const userMember = members.find(m => m.user_id === user.id);
          const totalOwed = userMember && !userMember.is_settled ? Number(userMember.amount_owed) : 0;
          const totalReceived = isCreator 
            ? members.filter(m => m.user_id !== user.id && !m.is_settled).reduce((sum, m) => sum + Number(m.amount_owed), 0)
            : 0;
          const settledCount = members.filter(m => m.is_settled).length;
          const membersWithNames = members.map(m => ({
            ...m,
            amount_owed: Number(m.amount_owed),
            user_name: profiles?.find(p => p.id === m.user_id)?.full_name || 'Unknown User',
          }));

          return {
            ...expense,
            member_count: members.length,
            total_owed: totalOwed,
            total_received: totalReceived,
            settled_count: settledCount,
            is_creator: isCreator,
            members: membersWithNames,
          };
        });

      setExpenses(processedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const emails = memberEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload: TablesInsert<'expenses'> = {
        user_id: user.id,
        name: groupName.trim(),
        total_amount: 0,
      };

      const { data: newExpense, error: expenseError } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single();

      if (expenseError) throw expenseError;

      const { error: addCreatorError } = await supabase
        .from('expense_members')
        .insert({
          expense_id: newExpense!.id,
          user_id: user.id,
          amount_owed: 0,
        });
      if (addCreatorError) throw addCreatorError;

      let addedCount = 0;
      let notFound: string[] = [];

      if (emails.length > 0) {
        const { data: foundProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('email', emails);
        if (profilesError) throw profilesError;

        const foundEmails = new Set((foundProfiles || []).map((p: any) => (p.email || '').toLowerCase()));
        notFound = emails.filter(e => !foundEmails.has(e.toLowerCase()));

        const membersToInsert = (foundProfiles || [])
          .filter((p: any) => p.id !== user.id)
          .map((p: any) => ({
            expense_id: newExpense!.id,
            user_id: p.id,
            amount_owed: 0,
          }));

        if (membersToInsert.length > 0) {
          const { error: membersInsertError } = await supabase
            .from('expense_members')
            .insert(membersToInsert as TablesInsert<'expense_members'>[]);
          if (membersInsertError) throw membersInsertError;
          addedCount = membersToInsert.length;
        }
      }

      toast.success(`Group created! Added ${addedCount} member(s).${notFound.length ? ` ${notFound.length} email(s) not found.` : ''}`);
      
      setGroupName('');
      setMemberEmails('');
      setCreateDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const addExpenseToGroup = async () => {
    if (!selectedExpense || !expenseName.trim() || !expenseAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newTotal = Number(selectedExpense.total_amount) + amount;
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ total_amount: newTotal })
        .eq('id', selectedExpense.id);

      if (updateError) throw updateError;

      toast.success('Expense added');
      setExpenseName('');
      setExpenseAmount('');
      setAddExpenseDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const toggleSettlement = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('expense_members')
        .update({ is_settled: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(currentStatus ? 'Marked as unpaid' : 'Marked as paid');
      fetchExpenses();
      
      if (selectedExpense) {
        const updated = expenses.find(e => e.id === selectedExpense.id);
        if (updated) setSelectedExpense(updated);
      }
    } catch (error) {
      console.error('Error toggling settlement:', error);
      toast.error('Failed to update settlement status');
    }
  };

  const viewDetails = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setSelectedExpense(expense);
      setDetailsDialogOpen(true);
    }
  };

  const openAddExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setSelectedExpense(expense);
      setAddExpenseDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 p-6">
      <LanguageToggle />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
              {t('expenses.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              Split expenses fairly
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('expenses.createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('expenses.createGroup')}</DialogTitle>
                <DialogDescription>
                  Create a new expense group and add members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Group Name</Label>
                  <Input
                    placeholder="e.g., Weekend Trip"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2">Member Emails (comma-separated)</Label>
                  <Input
                    placeholder="john@example.com, jane@example.com"
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Members must have profiles in the system
                  </p>
                </div>
                <Button onClick={createGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : expenses.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-16 h-16 text-muted mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Expense Groups Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('expenses.noGroups')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="relative">
                <ExpenseCard
                  expense={expense}
                  onViewDetails={viewDetails}
                  onAddExpense={openAddExpense}
                />
                <Button
                  onClick={() => {
                    setSelectedExpense(expense);
                    setInviteDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4"
                >
                  Invite
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('expenses.addExpense')}</DialogTitle>
            <DialogDescription>
              Add a new expense to {selectedExpense?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium mb-2">Expense Description</Label>
              <Input
                placeholder="e.g., Dinner at restaurant"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">Amount (SAR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={addExpenseToGroup} className="w-full">
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ExpenseDetailsDialog
        expense={selectedExpense}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onToggleSettlement={toggleSettlement}
      />

      {selectedExpense && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          resourceId={selectedExpense.id}
          resourceType="expense"
          resourceName={selectedExpense.name}
        />
      )}

      <Navigation />
    </div>
  );
};

export default Expenses;
