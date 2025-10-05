import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, Plus, Users, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { InviteDialog } from '@/components/InviteDialog';
import EditExpenseDialog from '@/components/EditExpenseDialog';
import ExpenseGroupDetailsDialog from '@/components/ExpenseGroupDetailsDialog';
import ExpenseDetailsDialog from '@/components/ExpenseDetailsDialog';
import { SkeletonList } from '@/components/ui/skeleton-card';
import { useIsRTL } from '@/lib/rtl-utils';
import { responsiveText, responsiveSpacing } from '@/lib/responsive-utils';
import { formatCurrency } from '@/lib/formatters';
import { SplitTypeSelector } from '@/components/SplitTypeSelector';

type ExpenseGroup = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  total_expenses: number;
  net_balance: number;
  settlement_summary?: {
    from: string;
    to: string;
    amount: number;
  }[];
};

const Expenses = () => {
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [groupExpenses, setGroupExpenses] = useState<any[]>([]);
  const [expenseDetailsDialogOpen, setExpenseDetailsDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [category, setCategory] = useState<string>('other');
  const [groupMembers, setGroupMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom' | 'shares'>('equal');
  const [memberSplits, setMemberSplits] = useState<Array<{ user_id: string; name: string; split_value?: number; calculated_amount?: number }>>([]);
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  useEffect(() => {
    checkAuth();
    fetchGroups();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/auth');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('expense_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch all members
      const { data: membersData } = await supabase
        .from('expense_group_members')
        .select('group_id, user_id');

      // Fetch all expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('group_id, total_amount, paid_by, user_id');

      // Fetch profiles for names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      // Process groups
      const processedGroups: ExpenseGroup[] = (groupsData || []).map((group) => {
        const members = membersData?.filter(m => m.group_id === group.id) || [];
        const groupExpenses = expensesData?.filter(e => e.group_id === group.id) || [];
        
        // Calculate net balance for current user
        let netBalance = 0;
        const memberBalances: Record<string, number> = {};

        // Initialize all members with 0 balance
        members.forEach(m => {
          memberBalances[m.user_id] = 0;
        });

        // Calculate balances based on expenses
        groupExpenses.forEach(expense => {
          const amount = Number(expense.total_amount);
          const payer = expense.paid_by || expense.user_id;
          const splitAmount = amount / (members.length || 1);

          // Payer gets positive balance
          memberBalances[payer] = (memberBalances[payer] || 0) + amount;

          // Everyone owes their split
          members.forEach(m => {
            memberBalances[m.user_id] = (memberBalances[m.user_id] || 0) - splitAmount;
          });
        });

        netBalance = memberBalances[user.id] || 0;

        // Calculate settlement summary
        const settlement_summary: { from: string; to: string; amount: number }[] = [];
        const debtors: { id: string; amount: number; name: string }[] = [];
        const creditors: { id: string; amount: number; name: string }[] = [];

        Object.entries(memberBalances).forEach(([userId, balance]) => {
          const userName = profiles?.find(p => p.id === userId)?.full_name || 'Unknown';
          if (balance < -0.01) {
            debtors.push({ id: userId, amount: Math.abs(balance), name: userName });
          } else if (balance > 0.01) {
            creditors.push({ id: userId, amount: balance, name: userName });
          }
        });

        // Simplified settlement: match debtors with creditors
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let di = 0, ci = 0;
        while (di < debtors.length && ci < creditors.length) {
          const debtor = debtors[di];
          const creditor = creditors[ci];
          const amount = Math.min(debtor.amount, creditor.amount);

          if (amount > 0.01) {
            settlement_summary.push({
              from: debtor.name,
              to: creditor.name,
              amount: Math.round(amount * 100) / 100,
            });
          }

          debtor.amount -= amount;
          creditor.amount -= amount;

          if (debtor.amount < 0.01) di++;
          if (creditor.amount < 0.01) ci++;
        }

        return {
          id: group.id,
          name: group.name,
          created_by: group.created_by,
          created_at: group.created_at,
          member_count: members.length,
          total_expenses: groupExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0),
          net_balance: Math.round(netBalance * 100) / 100,
          settlement_summary,
        };
      });

      setGroups(processedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load expense groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: membersData } = await supabase
        .from('expense_group_members')
        .select('user_id')
        .eq('group_id', groupId);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', membersData?.map(m => m.user_id) || []);

      setGroupMembers(profiles?.map(p => ({ id: p.id, name: p.full_name || 'Unknown' })) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const emails = memberEmails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    try {
      const { data, error } = await supabase.functions.invoke('create-expense-group', {
        body: {
          groupName: groupName.trim(),
          emails,
        },
      });

      if (error) throw error;

      const added = data?.addedCount || 0;
      const invites = data?.invitationsCreated || 0;

      const message = `Group created! ${added ? `Added ${added} member(s). ` : ''}${invites ? `Created ${invites} invitation(s).` : ''}`;
      toast.success(message);

      setGroupName('');
      setMemberEmails('');
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const addExpense = async () => {
    if (!selectedGroup || !expenseDescription.trim() || !expenseAmount || !paidBy) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate splits
    const totalSplit = memberSplits.reduce((sum, m) => sum + (m.calculated_amount || 0), 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      toast.error('Split amounts must equal the total expense');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: selectedGroup.id,
          name: expenseDescription.trim(),
          description: expenseDescription.trim(),
          total_amount: amount,
          paid_by: paidBy,
          user_id: user.id,
          category: category as any,
          split_type: splitType,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create expense members with custom splits
      const membersToInsert = memberSplits.map(split => ({
        expense_id: expenseData.id,
        user_id: split.user_id,
        amount_owed: split.calculated_amount || 0,
        split_value: splitType === 'equal' ? null : split.split_value,
      }));

      const { error: membersError } = await supabase
        .from('expense_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      toast.success('Expense added successfully');
      setExpenseDescription('');
      setExpenseAmount('');
      setPaidBy('');
      setCategory('other');
      setSplitType('equal');
      setMemberSplits([]);
      setAddExpenseDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const openAddExpense = async (group: ExpenseGroup) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
    setSplitType('equal');
    setMemberSplits([]);
    setAddExpenseDialogOpen(true);
  };

  const fetchGroupExpenses = async (groupId: string) => {
    try {
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const { data: { user } } = await supabase.auth.getUser();

      // Fetch expense members with settlement status
      const expenseIds = expensesData?.map(e => e.id) || [];
      const { data: membersData } = await supabase
        .from('expense_members')
        .select('*')
        .in('expense_id', expenseIds);

      const processedExpenses = (expensesData || []).map(expense => ({
        ...expense,
        paid_by_name: profiles?.find(p => p.id === expense.paid_by)?.full_name || 'Unknown',
        creator_name: profiles?.find(p => p.id === expense.user_id)?.full_name || 'Unknown',
        is_creator: expense.user_id === user?.id,
        user_id: expense.user_id,
        members: membersData
          ?.filter(m => m.expense_id === expense.id)
          .map(m => ({
            ...m,
            user_name: profiles?.find(p => p.id === m.user_id)?.full_name || 'Unknown'
          })) || []
      }));

      setGroupExpenses(processedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const openGroupDetails = async (group: ExpenseGroup) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
    await fetchGroupExpenses(group.id);
    setDetailsDialogOpen(true);
  };

  const openEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setEditExpenseDialogOpen(true);
  };

  const updateExpense = async (id: string, name: string, amount: number, paidBy: string, category: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          name,
          total_amount: amount,
          paid_by: paidBy,
          category: category as any,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense updated successfully');
      setEditExpenseDialogOpen(false);
      fetchGroups();
      if (selectedGroup) {
        await fetchGroupExpenses(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast.success('Expense deleted successfully');
      fetchGroups();
      if (selectedGroup) {
        await fetchGroupExpenses(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const toggleSettlement = async (memberId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newStatus = !currentStatus;
      const paidAt = newStatus ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('expense_members')
        .update({ 
          is_settled: newStatus,
          paid_at: paidAt
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(newStatus ? 'Marked as paid' : 'Marked as unpaid');
      
      if (selectedGroup) {
        await fetchGroupExpenses(selectedGroup.id);
      }
    } catch (error) {
      console.error('Error toggling settlement:', error);
      toast.error('Failed to update settlement status');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      
      <div className={`max-w-7xl mx-auto ${responsiveSpacing.sectionGap}`}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className="space-y-1">
            <h1 className={`${responsiveText.pageTitle} font-semibold text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('expenses.title')}
            </h1>
            <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('expenses.subtitle')}
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('expenses.createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('expenses.createExpenseGroup')}</DialogTitle>
                <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
                  {t('expenses.createNewGroup')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.groupName')}</Label>
                  <Input
                    placeholder={t('expenses.groupNamePlaceholder')}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.memberEmails')}</Label>
                  <Input
                    placeholder={t('expenses.memberEmailsPlaceholder')}
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    className="mt-2"
                  />
                  <p className={`text-xs text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('expenses.emailInviteInfo')}
                  </p>
                </div>
                <Button onClick={createGroup} className="w-full">
                  {t('expenses.createGroup')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonList count={6} />
        ) : groups.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-16 h-16 text-muted mb-4" />
              <h3 className={`text-xl font-semibold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.noExpenseGroups')}</h3>
              <p className={`text-sm text-muted-foreground max-w-md ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('expenses.createFirstGroup')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="border border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <h3 className={`font-semibold text-lg ${isRTL ? 'text-right' : 'text-left'}`}>{group.name}</h3>
                      <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                        {group.member_count} {group.member_count !== 1 ? t('expenses.members') : t('expenses.member')}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedGroup(group);
                        setInviteDialogOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {t('expenses.invite')}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-muted-foreground">{t('expenses.totalExpenses')}</span>
                      <span className="font-medium">{formatCurrency(group.total_expenses)}</span>
                    </div>

                    <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-muted-foreground">{t('expenses.yourBalance')}</span>
                      <span className={`font-medium ${group.net_balance > 0 ? 'text-success' : group.net_balance < 0 ? 'text-destructive' : ''}`}>
                        {group.net_balance > 0 ? '+' : ''}{formatCurrency(group.net_balance)}
                      </span>
                    </div>

                    {group.settlement_summary && group.settlement_summary.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <p className={`text-xs font-semibold text-foreground mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.whoOwesWhom')}</p>
                        <div className="space-y-2">
                          {group.settlement_summary.slice(0, 2).map((settlement, idx) => (
                            <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded-md bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="font-medium">{settlement.from}</span>
                                <ArrowRight className={`w-4 h-4 text-primary ${isRTL ? 'rotate-180' : ''}`} />
                                <span className="font-medium">{settlement.to}</span>
                              </div>
                              <span className="text-foreground font-semibold">{formatCurrency(settlement.amount)}</span>
                            </div>
                          ))}
                          {group.settlement_summary.length > 2 && (
                            <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>+{group.settlement_summary.length - 2} {t('expenses.more')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      onClick={() => openAddExpense(group)}
                      className="flex-1"
                      variant="outline"
                    >
                      <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('expenses.addExpense')}
                    </Button>
                    <Button
                      onClick={() => openGroupDetails(group)}
                      className="flex-1"
                    >
                      {t('expenses.viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('expenses.addExpenseTitle')}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('expenses.addExpenseTo')} {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.description')}</Label>
              <Input
                placeholder={t('expenses.descriptionPlaceholder')}
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={t('expenses.amountPlaceholder')}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.paidBy')}</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('expenses.selectWhoPaid')} />
                </SelectTrigger>
                <SelectContent>
                  {groupMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expenses.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('expenses.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">{t('expenses.categories.food')}</SelectItem>
                  <SelectItem value="transport">{t('expenses.categories.transport')}</SelectItem>
                  <SelectItem value="entertainment">{t('expenses.categories.entertainment')}</SelectItem>
                  <SelectItem value="utilities">{t('expenses.categories.utilities')}</SelectItem>
                  <SelectItem value="shopping">{t('expenses.categories.shopping')}</SelectItem>
                  <SelectItem value="health">{t('expenses.categories.health')}</SelectItem>
                  <SelectItem value="education">{t('expenses.categories.education')}</SelectItem>
                  <SelectItem value="other">{t('expenses.categories.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {expenseAmount && parseFloat(expenseAmount) > 0 && groupMembers.length > 0 && (
              <SplitTypeSelector
                totalAmount={parseFloat(expenseAmount)}
                members={groupMembers}
                onSplitsChange={(type, splits) => {
                  setSplitType(type);
                  setMemberSplits(splits);
                }}
                initialSplitType={splitType}
                initialSplits={memberSplits}
              />
            )}
            
            <Button onClick={addExpense} className="w-full">
              {t('expenses.addExpense')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {selectedGroup && (
        <>
          <InviteDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            resourceId={selectedGroup.id}
            resourceType="expense"
            resourceName={selectedGroup.name}
          />

          <ExpenseGroupDetailsDialog
            group={selectedGroup}
            expenses={groupExpenses}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            onAddExpense={() => {
              setDetailsDialogOpen(false);
              openAddExpense(selectedGroup);
            }}
            onEditExpense={openEditExpense}
            onDeleteExpense={deleteExpense}
            onViewExpenseDetails={(expense) => {
              setSelectedExpense(expense);
              setExpenseDetailsDialogOpen(true);
            }}
            currentUserId={currentUserId}
          />
        </>
      )}

      {selectedExpense && (
        <>
          <EditExpenseDialog
            expense={selectedExpense}
            open={editExpenseDialogOpen}
            onOpenChange={setEditExpenseDialogOpen}
            onSave={updateExpense}
            groupMembers={groupMembers}
          />
          <ExpenseDetailsDialog
            expense={selectedExpense}
            open={expenseDetailsDialogOpen}
            onOpenChange={setExpenseDetailsDialogOpen}
            onToggleSettlement={toggleSettlement}
            currentUserId={currentUserId}
          />
        </>
      )}

      <Navigation />
    </div>
  );
};

export default Expenses;
