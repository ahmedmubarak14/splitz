import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { PushNotificationSetup } from './PushNotificationSetup';

interface Preferences {
  habit_reminders: boolean;
  challenge_updates: boolean;
  expense_alerts: boolean;
  subscription_reminders: boolean;
  trip_updates: boolean;
  friend_requests: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  reminder_time: string;
}

export default function NotificationPreferences() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [preferences, setPreferences] = useState<Preferences>({
    habit_reminders: true,
    challenge_updates: true,
    expense_alerts: true,
    subscription_reminders: true,
    trip_updates: true,
    friend_requests: true,
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
          subscription_reminders: data.subscription_reminders ?? true,
          trip_updates: data.trip_updates ?? true,
          friend_requests: data.friend_requests ?? true,
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
      toast.success(t('notifications.preferencesUpdated'));
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error(t('notifications.updateFailed'));
    }
  };

  if (loading) {
    return <div className="p-4">{t('notifications.loading')}</div>;
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <PushNotificationSetup />
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.types.title')}</CardTitle>
          <CardDescription>{t('notifications.types.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="habit_reminders" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.habitReminders')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.habitRemindersDesc')}
              </span>
            </Label>
            <Switch
              id="habit_reminders"
              checked={preferences.habit_reminders}
              onCheckedChange={(checked) => updatePreference('habit_reminders', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="challenge_updates" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.challengeUpdates')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.challengeUpdatesDesc')}
              </span>
            </Label>
            <Switch
              id="challenge_updates"
              checked={preferences.challenge_updates}
              onCheckedChange={(checked) => updatePreference('challenge_updates', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="expense_alerts" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.expenseAlerts')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.expenseAlertsDesc')}
              </span>
            </Label>
            <Switch
              id="expense_alerts"
              checked={preferences.expense_alerts}
              onCheckedChange={(checked) => updatePreference('expense_alerts', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="subscription_reminders" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.subscriptionReminders')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.subscriptionRemindersDesc')}
              </span>
            </Label>
            <Switch
              id="subscription_reminders"
              checked={preferences.subscription_reminders}
              onCheckedChange={(checked) => updatePreference('subscription_reminders', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="trip_updates" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.tripUpdates')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.tripUpdatesDesc')}
              </span>
            </Label>
            <Switch
              id="trip_updates"
              checked={preferences.trip_updates}
              onCheckedChange={(checked) => updatePreference('trip_updates', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="friend_requests" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.types.friendRequests')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.types.friendRequestsDesc')}
              </span>
            </Label>
            <Switch
              id="friend_requests"
              checked={preferences.friend_requests}
              onCheckedChange={(checked) => updatePreference('friend_requests', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.delivery.title')}</CardTitle>
          <CardDescription>{t('notifications.delivery.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="push_notifications" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.delivery.push')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.delivery.pushDesc')}
              </span>
            </Label>
            <Switch
              id="push_notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>

          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Label htmlFor="email_notifications" className={`flex flex-col gap-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <span>{t('notifications.delivery.email')}</span>
              <span className="font-normal text-sm text-muted-foreground">
                {t('notifications.delivery.emailDesc')}
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
