import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

interface EditExpenseDialogProps {
  expense: {
    id: string;
    name: string;
    total_amount: number;
    paid_by: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string, amount: number, paidBy: string) => void;
  groupMembers: Array<{ id: string; name: string }>;
}

const EditExpenseDialog = ({ expense, open, onOpenChange, onSave, groupMembers }: EditExpenseDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [paidBy, setPaidBy] = React.useState('');

  React.useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.total_amount.toString());
      setPaidBy(expense.paid_by);
    }
  }, [expense]);

  const handleSave = () => {
    if (expense && name.trim() && amount && paidBy) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        onSave(expense.id, name.trim(), parsedAmount, paidBy);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('dialogs.editExpense')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('dialogs.updateExpenseDetails')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-sm font-semibold mb-2">{t('dialogs.expenseDescription')} *</Label>
            <Input
              placeholder={t('dialogs.expenseDescriptionPlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2">{t('dialogs.amount')} *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={t('dialogs.amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2">{t('dialogs.paidBy')} *</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-12 mt-2">
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
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              className="flex-1 h-12 text-base"
              variant="gradient"
            >
              {t('dialogs.saveChanges')}
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="outline"
              className="h-12"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
