import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Preferences {
  habit_reminders: boolean;
  challenge_updates: boolean;
  expense_alerts: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  reminder_time: string;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences>({
    habit_reminders: true,
    challenge_updates: true,
    expense_alerts: true,
    push_notifications: false,
    email_notifications: false,
    reminder_time: '09:00:00',
  });
  const [loading, setLoading] = useState(true);

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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          habit_reminders: data.habit_reminders,
          challenge_updates: data.challenge_updates,
          expense_alerts: data.expense_alerts,
          push_notifications: data.push_notifications,
          email_notifications: data.email_notifications,
          reminder_time: data.reminder_time,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof Preferences, value: boolean | string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, [key]: value }));
      toast.success("Preferences updated");
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error("Failed to update preferences");
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="habit_reminders" className="flex flex-col gap-1">
              <span>Habit Reminders</span>
              <span className="font-normal text-sm text-muted-foreground">
                Get reminded to complete your daily habits
              </span>
            </Label>
            <Switch
              id="habit_reminders"
              checked={preferences.habit_reminders}
              onCheckedChange={(checked) => updatePreference('habit_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="challenge_updates" className="flex flex-col gap-1">
              <span>Challenge Updates</span>
              <span className="font-normal text-sm text-muted-foreground">
                Get notified about challenge progress and milestones
              </span>
            </Label>
            <Switch
              id="challenge_updates"
              checked={preferences.challenge_updates}
              onCheckedChange={(checked) => updatePreference('challenge_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="expense_alerts" className="flex flex-col gap-1">
              <span>Expense Alerts</span>
              <span className="font-normal text-sm text-muted-foreground">
                Get notified about new expenses and settlements
              </span>
            </Label>
            <Switch
              id="expense_alerts"
              checked={preferences.expense_alerts}
              onCheckedChange={(checked) => updatePreference('expense_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push_notifications" className="flex flex-col gap-1">
              <span>Push Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive notifications in your browser
              </span>
            </Label>
            <Switch
              id="push_notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email_notifications" className="flex flex-col gap-1">
              <span>Email Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive notifications via email
              </span>
            </Label>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
