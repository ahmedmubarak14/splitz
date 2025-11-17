import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SplitTypeSelector } from '@/components/SplitTypeSelector';

type SplitType = 'equal' | 'percentage' | 'custom' | 'shares';

interface MemberSplit {
  user_id: string;
  name: string;
  split_value?: number;
  calculated_amount?: number;
}

interface CreateExpenseDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateExpenseDialog = ({ groupId, open, onOpenChange, onSuccess }: CreateExpenseDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('other');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [groupMembers, setGroupMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && groupId) {
      fetchGroupMembers();
    }
  }, [open, groupId]);

  const handleSplitsChange = (newSplitType: SplitType, newSplits: MemberSplit[]) => {
    setSplitType(newSplitType);
    setMemberSplits(newSplits);
  };

  const fetchGroupMembers = async () => {
    try {
      const { data: members } = await supabase
        .from('expense_group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!members || members.length === 0) return;

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase.rpc(
        'get_public_profiles',
        { _user_ids: userIds }
      );

      const membersWithNames = members.map(member => ({
        id: member.user_id,
        name: profiles?.find((p: any) => p.id === member.user_id)?.full_name || 'Unknown User'
      }));

      setGroupMembers(membersWithNames);
      
      // Set first member as default payer
      if (membersWithNames.length > 0 && !paidBy) {
        setPaidBy(membersWithNames[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || !paidBy) {
      toast.error(t('errors.fillAllFields'));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }

    const totalSplit = memberSplits.reduce((sum, m) => sum + (m.calculated_amount || 0), 0);
    if (Math.abs(totalSplit - parsedAmount) > 0.01) {
      toast.error(t('errors.splitsMustEqualTotal'));
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          name: name.trim(),
          description: name.trim(),
          total_amount: parsedAmount,
          paid_by: paidBy,
          user_id: user.id,
          category: category as any,
          split_type: splitType,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

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

      toast.success(t('trips.expenses.expenseCreated'));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create expense:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setPaidBy('');
    setCategory('other');
    setSplitType('equal');
    setMemberSplits([]);
  };

  const categories = [
    { value: 'food', label: '🍔 Food', icon: '🍔' },
    { value: 'transport', label: '🚗 Transport', icon: '🚗' },
    { value: 'entertainment', label: '🎬 Entertainment', icon: '🎬' },
    { value: 'utilities', label: '⚡ Utilities', icon: '⚡' },
    { value: 'shopping', label: '🛍️ Shopping', icon: '🛍️' },
    { value: 'health', label: '💊 Health', icon: '💊' },
    { value: 'education', label: '📚 Education', icon: '📚' },
    { value: 'other', label: '📦 Other', icon: '📦' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('trips.expenses.addExpense')}</DialogTitle>
          <DialogDescription>{t('trips.expenses.addExpenseDesc')}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('dialogs.expenseDescription')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dialogs.expenseDescriptionPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('dialogs.amount')} *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('dialogs.amountPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">{t('dialogs.paidBy')} *</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paidBy">
                <SelectValue placeholder={t('dialogs.selectWhoPaid')} />
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

          <div className="space-y-2">
            <Label htmlFor="category">{t('common.category')} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t('common.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('dialogs.splitType')}</Label>
            <SplitTypeSelector
              totalAmount={parseFloat(amount) || 0}
              members={groupMembers}
              onSplitsChange={handleSplitsChange}
              initialSplitType={splitType}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};