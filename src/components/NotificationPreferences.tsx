import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Clock } from 'lucide-react';

interface Preferences {
  habit_reminders: boolean;
  challenge_updates: boolean;
  expense_alerts: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  reminder_time: string;
}

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<Preferences>({
    habit_reminders: true,
    challenge_updates: true,
    expense_alerts: true,
    email_notifications: false,
    push_notifications: false,
    reminder_time: '09:00:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast.success('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading preferences...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* In-App Notifications */}
        <div>
          <h3 className="font-semibold mb-3">In-App Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="habit-reminders" className="font-medium">
                  Habit Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about your daily habits
                </p>
              </div>
              <Switch
                id="habit-reminders"
                checked={preferences.habit_reminders}
                onCheckedChange={(checked) => updatePreference('habit_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="challenge-updates" className="font-medium">
                  Challenge Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get updates on challenge progress and participants
                </p>
              </div>
              <Switch
                id="challenge-updates"
                checked={preferences.challenge_updates}
                onCheckedChange={(checked) => updatePreference('challenge_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="expense-alerts" className="font-medium">
                  Expense Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new expenses and payments
                </p>
              </div>
              <Switch
                id="expense-alerts"
                checked={preferences.expense_alerts}
                onCheckedChange={(checked) => updatePreference('expense_alerts', checked)}
              />
            </div>
          </div>
        </div>

        {/* Other Notification Channels */}
        <div>
          <h3 className="font-semibold mb-3">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifs" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifs"
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifs" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                id="push-notifs"
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Reminder Time */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Daily Reminder Time
          </h3>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={preferences.reminder_time.substring(0, 5)}
              onChange={(e) => updatePreference('reminder_time', e.target.value + ':00')}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">Riyadh Time (UTC+3)</span>
          </div>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
