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
import { DollarSign, Plus, Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import ExpenseCard from '@/components/ExpenseCard';
import ExpenseDetailsDialog from '@/components/ExpenseDetailsDialog';

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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null);
  
  // Create group form state
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  
  // Add expense form state
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
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all expenses where user is creator or member
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch all expense members
      const { data: allMembers } = await supabase
        .from('expense_members')
        .select('*');

      // Fetch profiles for member names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      // Filter and process expenses where user is involved
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
          
          // Calculate total received (if creator and others owe money)
          const totalReceived = isCreator 
            ? members
                .filter(m => m.user_id !== user.id && !m.is_settled)
                .reduce((sum, m) => sum + Number(m.amount_owed), 0)
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

    const emails = memberEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      toast.error('Please add at least one member email');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the expense group
      const payload: TablesInsert<'expenses'> = {
        user_id: user.id,
        name: groupName.trim(),
        total_amount: 0,
      };

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert(payload);

      if (expenseError) throw expenseError;

      // Find users by email (using profiles table)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('full_name', emails);

      // For now, we'll just create placeholder members
      // In production, you'd have a proper user lookup by email
      toast.success(`Group created! Add members manually for now.`);
      
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

      // Update total amount
      const newTotal = Number(selectedExpense.total_amount) + amount;
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ total_amount: newTotal })
        .eq('id', selectedExpense.id);

      if (updateError) throw updateError;

      // Calculate split amount per member (equal split for now)
      const memberCount = selectedExpense.member_count || 1;
      const splitAmount = newTotal / memberCount;

      // Update all members with new split amount
      const { error: membersError } = await supabase
        .from('expense_members')
        .update({ amount_owed: splitAmount })
        .eq('expense_id', selectedExpense.id);

      if (membersError) throw membersError;

      toast.success('Expense added! 💰');
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

      toast.success(currentStatus ? 'Marked as unpaid' : 'Marked as paid ✓');
      fetchExpenses();
      
      // Update selected expense if details dialog is open
      if (selectedExpense) {
        const updated = expenses.find(e => e.id === selectedExpense.id);
        if (updated) {
          setSelectedExpense(updated);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pb-24 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center shadow-secondary animate-pulse-glow">
                <DollarSign className="w-7 h-7 text-foreground" />
              </div>
              <div>
                <h1 className="font-display text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {t('expenses.title')}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Split expenses fairly
                </p>
              </div>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="gradient" className="text-lg">
                <Plus className="w-5 h-5 mr-2" />
                {t('expenses.createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('expenses.createGroup')}</DialogTitle>
                <DialogDescription className="text-base">
                  Create a new expense group and add members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-sm font-semibold mb-2">Group Name *</Label>
                  <Input
                    placeholder="e.g., Weekend Trip"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-12 mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2">Member Emails (comma-separated)</Label>
                  <Input
                    placeholder="john@example.com, jane@example.com"
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    className="h-12 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Members must have profiles in the system
                  </p>
                </div>
                <Button 
                  onClick={createGroup} 
                  className="w-full h-12 text-base"
                  variant="gradient"
                >
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : expenses.length === 0 ? (
          <Card className="shadow-card border-2">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl gradient-secondary flex items-center justify-center mb-6 animate-bounce-slow">
                <Users className="w-10 h-10 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Expense Groups Yet</h3>
              <p className="text-lg text-muted-foreground max-w-md">
                {t('expenses.noGroups')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onViewDetails={viewDetails}
                onAddExpense={openAddExpense}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('expenses.addExpense')}</DialogTitle>
            <DialogDescription className="text-base">
              Add a new expense to {selectedExpense?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-semibold mb-2">Expense Description *</Label>
              <Input
                placeholder="e.g., Dinner at restaurant"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="h-12 mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2">Amount (SAR) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="h-12 mt-2"
              />
            </div>
            <Button 
              onClick={addExpenseToGroup} 
              className="w-full h-12 text-base"
              variant="gradient"
            >
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

      <Navigation />
    </div>
  );
};

export default Expenses;
