import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { SubscriptionSplitTypeSelector } from './SubscriptionSplitTypeSelector';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  next_renewal_date: string;
  is_shared: boolean;
  notifications_enabled: boolean;
  reminder_days_before: number;
  status: string;
  notes?: string;
}

interface EditSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
}

const EditSubscriptionDialog = ({ open, onOpenChange, subscription }: EditSubscriptionDialogProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(subscription.name);
  const [amount, setAmount] = useState(subscription.amount.toString());
  const [currency, setCurrency] = useState(subscription.currency);
  const [billingCycle, setBillingCycle] = useState(subscription.billing_cycle);
  const [nextRenewalDate, setNextRenewalDate] = useState(subscription.next_renewal_date);
  const [isShared, setIsShared] = useState(subscription.is_shared);
  const [notificationsEnabled, setNotificationsEnabled] = useState(subscription.notifications_enabled);
  const [reminderDays, setReminderDays] = useState(subscription.reminder_days_before.toString());
  const [status, setStatus] = useState(subscription.status);
  const [notes, setNotes] = useState(subscription.notes || '');
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom' | 'shares'>('equal');
  const [memberSplits, setMemberSplits] = useState<any[]>([]);

  // Fetch contributors for split type selector
  const { data: contributors } = useQuery({
    queryKey: ['subscription-contributors', subscription.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_contributors')
        .select(`
          id,
          user_id,
          contribution_amount,
          split_value
        `)
        .eq('subscription_id', subscription.id);

      if (error) throw error;

      // Fetch profiles
      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        return data.map(contributor => ({
          user_id: contributor.user_id,
          full_name: profiles?.find(p => p.id === contributor.user_id)?.full_name || 'Unknown',
          split_value: contributor.split_value
        }));
      }
      return [];
    },
    enabled: open && isShared,
  });

  useEffect(() => {
    setName(subscription.name);
    setAmount(subscription.amount.toString());
    setCurrency(subscription.currency);
    setBillingCycle(subscription.billing_cycle);
    setNextRenewalDate(subscription.next_renewal_date);
    setIsShared(subscription.is_shared);
    setNotificationsEnabled(subscription.notifications_enabled);
    setReminderDays(subscription.reminder_days_before.toString());
    setStatus(subscription.status);
    setNotes(subscription.notes || '');
    setSplitType((subscription as any).split_type || 'equal');
  }, [subscription]);

  const updateSubscription = useMutation({
    mutationFn: async () => {
      const updates: any = {
        name,
        amount: parseFloat(amount),
        currency,
        billing_cycle: billingCycle,
        next_renewal_date: nextRenewalDate,
        is_shared: isShared,
        notifications_enabled: notificationsEnabled,
        reminder_days_before: parseInt(reminderDays),
        status,
        notes: notes || null,
        split_type: isShared ? splitType : null,
      };

      if (status === 'canceled' && subscription.status !== 'canceled') {
        updates.canceled_at = new Date().toISOString();
      }
      if (status === 'paused' && subscription.status !== 'paused') {
        updates.paused_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription updated successfully');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update subscription');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateSubscription.mutate();
  };

  const isRecurring = billingCycle !== 'one-time';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Subscription Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Netflix, Spotify, etc."
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">🟢 Active</SelectItem>
                  <SelectItem value="paused">⏸️ Paused</SelectItem>
                  <SelectItem value="canceled">🔴 Canceled</SelectItem>
                  <SelectItem value="archived">📦 Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.99"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger id="billingCycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRecurring && (
              <div>
                <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
                <Input
                  id="nextRenewalDate"
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {isRecurring && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Renewal Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified before renewal
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              {notificationsEnabled && (
                <div>
                  <Label htmlFor="reminderDays">Remind Me (Days Before)</Label>
                  <Select value={reminderDays} onValueChange={setReminderDays}>
                    <SelectTrigger id="reminderDays">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">7 days before</SelectItem>
                      <SelectItem value="14">14 days before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shared">Shared Subscription</Label>
                <p className="text-sm text-muted-foreground">
                  Split cost with contributors
                </p>
              </div>
              <Switch
                id="shared"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
            </div>

            {isShared && contributors && contributors.length > 0 && (
              <SubscriptionSplitTypeSelector
                totalAmount={parseFloat(amount) || 0}
                currency={currency}
                members={contributors}
                onSplitsChange={(splits, newSplitType) => {
                  setMemberSplits(splits);
                  setSplitType(newSplitType);
                }}
                initialSplitType={splitType}
                initialSplits={contributors.map(c => ({
                  user_id: c.user_id,
                  split_value: c.split_value
                }))}
              />
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSubscription.isPending}>
              {updateSubscription.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubscriptionDialog;
