import { useState, useEffect } from 'react';
import { Home, ListChecks, Brain, DollarSign, Trophy, CreditCard, Plane, Calendar, Grid3X3, Flame, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type NavItemId = 'dashboard' | 'habits' | 'tasks' | 'matrix' | 'focus' | 'calendar' | 'expenses' | 'subscriptions' | 'trips' | 'challenges';

interface NavItem {
  id: NavItemId;
  path: string;
  icon: typeof Home;
  label: string;
  description: string;
}

interface NavigationCustomizerProps {
  onSave?: () => void;
}

const NavigationCustomizer = ({ onSave }: NavigationCustomizerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<NavItemId[]>([
    'dashboard',
    'tasks',
    'focus',
    'expenses',
    'challenges',
  ]);
  const [saving, setSaving] = useState(false);

  const allNavItems: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', icon: Home, label: t('nav.dashboard'), description: 'Overview & quick actions' },
    { id: 'habits', path: '/habits', icon: Flame, label: t('nav.habits'), description: 'Track daily habits' },
    { id: 'tasks', path: '/tasks', icon: ListChecks, label: t('nav.tasks') || 'Tasks', description: 'Manage your tasks' },
    { id: 'matrix', path: '/matrix', icon: Grid3X3, label: t('nav.matrix') || 'Matrix', description: 'Eisenhower matrix' },
    { id: 'focus', path: '/focus', icon: Brain, label: t('nav.focus') || 'Focus', description: 'Pomodoro sessions' },
    { id: 'calendar', path: '/calendar', icon: Calendar, label: t('nav.calendar') || 'Calendar', description: 'View your schedule' },
    { id: 'expenses', path: '/expenses', icon: DollarSign, label: t('nav.expenses'), description: 'Split expenses' },
    { id: 'subscriptions', path: '/subscriptions', icon: CreditCard, label: t('nav.subscriptions'), description: 'Track subscriptions' },
    { id: 'trips', path: '/trips', icon: Plane, label: t('nav.trips'), description: 'Plan your trips' },
    { id: 'challenges', path: '/challenges', icon: Trophy, label: t('nav.challenges'), description: 'Join challenges' },
  ];

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('navigation_preferences')
      .select('visible_nav_items')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.visible_nav_items) {
      setSelectedItems(data.visible_nav_items as NavItemId[]);
    }
  };

  const toggleItem = (itemId: NavItemId, checked: boolean) => {
    if (checked) {
      if (selectedItems.length >= 5) {
        toast.error('Maximum 5 items allowed in navigation');
        return;
      }
      setSelectedItems([...selectedItems, itemId]);
    } else {
      if (selectedItems.length <= 1) {
        toast.error('At least 1 item required in navigation');
        return;
      }
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('navigation_preferences')
      .upsert({
        user_id: user.id,
        visible_nav_items: selectedItems,
        nav_order: selectedItems,
      });

    if (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } else {
      toast.success('Navigation preferences saved!');
      setOpen(false);
      onSave?.();
    }
    setSaving(false);
  };

  const resetToDefault = () => {
    setSelectedItems(['dashboard', 'tasks', 'focus', 'expenses', 'challenges']);
    toast.success('Reset to default navigation');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          Customize Navigation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Navigation</DialogTitle>
          <DialogDescription>
            Choose which features appear in your bottom navigation bar. Select up to 5 items for quick access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium">Select Navigation Items (Max 5)</p>
          {allNavItems.map(item => {
            const Icon = item.icon;
            const isSelected = selectedItems.includes(item.id);
            
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isSelected}
                  onCheckedChange={(checked) => toggleItem(item.id, checked)}
                  disabled={!isSelected && selectedItems.length >= 5}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Preview</p>
          <div className="flex justify-around items-center h-16 bg-muted rounded-lg px-2">
            <div className="flex flex-col items-center gap-0.5">
              <Settings className="w-4 h-4" />
              <span className="text-[10px]">Menu</span>
            </div>
            {selectedItems.slice(0, 5).map(itemId => {
              const item = allNavItems.find(i => i.id === itemId);
              if (!item) return null;
              const Icon = item.icon;
              return (
                <div key={itemId} className="flex flex-col items-center gap-0.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetToDefault}>
            Reset to Default
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NavigationCustomizer;
