import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ExpenseWithMembers = Tables<'expenses'> & { expense_members: Tables<'expense_members'>[] };

const Expenses = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseWithMembers[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [memberOpenFor, setMemberOpenFor] = useState<string | null>(null);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberAmount, setMemberAmount] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
    await fetchExpenses();
    setLoading(false);
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, name, total_amount, created_at, user_id, expense_members(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExpenses((data as unknown as ExpenseWithMembers[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      toast.error(message);
    }
  };

  const createExpense = async () => {
    if (!newName.trim() || !newTotal.trim()) return;
    const total = Number(newTotal);
    if (Number.isNaN(total) || total <= 0) {
      toast.error('Enter a valid total amount');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload: TablesInsert<'expenses'> = {
        user_id: user.id,
        name: newName.trim(),
        total_amount: total,
      };
      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;

      setNewName('');
      setNewTotal('');
      setCreateOpen(false);
      toast.success('Expense created');
      await fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create expense';
      toast.error(message);
    }
  };

  const addMember = async (expenseId: string) => {
    if (!memberUserId.trim() || !memberAmount.trim()) return;
    const amount = Number(memberAmount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      const payload: TablesInsert<'expense_members'> = {
        expense_id: expenseId,
        user_id: memberUserId.trim(),
        amount_owed: amount,
        is_settled: false,
      };
      const { error } = await supabase.from('expense_members').insert(payload);
      if (error) throw error;
      toast.success('Member added');
      setMemberUserId('');
      setMemberAmount('');
      setMemberOpenFor(null);
      await fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      toast.error(message);
    }
  };

  const markSettled = async (memberId: string, isSettled: boolean) => {
    try {
      const update: TablesUpdate<'expense_members'> = { is_settled: isSettled };
      const { error } = await supabase
        .from('expense_members')
        .update(update)
        .eq('id', memberId);
      if (error) throw error;
      await fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settlement';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('expenses.title')} 💰
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('expenses.groups')}
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-secondary text-white shadow-secondary hover:scale-105 transition-transform">
                {t('expenses.createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('expenses.createGroup')}</DialogTitle>
                <DialogDescription>Create a new expense group</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Total amount" value={newTotal} onChange={(e) => setNewTotal(e.target.value)} />
                <Button onClick={createExpense} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {expenses.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('expenses.noGroups')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {expenses.map((exp) => (
              <Card key={exp.id} className="shadow-card border-2">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{exp.name}</CardTitle>
                    <CardDescription className="mt-1">Total: {Number(exp.total_amount).toFixed(2)}</CardDescription>
                  </div>
                  <Dialog open={memberOpenFor === exp.id} onOpenChange={(o) => setMemberOpenFor(o ? exp.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add Member</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Add Member</DialogTitle>
                        <DialogDescription>Add a member by their user ID and amount owed</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Input placeholder="User ID (UUID)" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} />
                        <Input placeholder="Amount owed" value={memberAmount} onChange={(e) => setMemberAmount(e.target.value)} />
                        <Button onClick={() => addMember(exp.id)} className="w-full">Add</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exp.expense_members?.length ? (
                    <div className="space-y-2">
                      {exp.expense_members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                          <div className="text-sm">
                            <div className="font-medium">{m.user_id}</div>
                            <div className="text-muted-foreground">Owes: {Number(m.amount_owed).toFixed(2)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-1 rounded-full border {m.is_settled ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}">
                              {m.is_settled ? 'Settled' : 'Pending'}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => markSettled(m.id, !m.is_settled)}>
                              {m.is_settled ? 'Mark Unsettled' : 'Mark Settled'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members yet.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Expenses;
