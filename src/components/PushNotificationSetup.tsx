import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';

export const PushNotificationSetup = () => {
  const { t } = useTranslation();
  const { isSupported, permissionStatus, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null; // Only show on mobile
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('gamification.pushNotifications.title')}
        </CardTitle>
        <CardDescription>
          {t('gamification.pushNotifications.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissionStatus === 'granted' ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{t('gamification.pushNotifications.enabled')}</span>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <BellOff className="w-5 h-5" />
            <span className="text-sm">
              {t('gamification.pushNotifications.blocked')}
            </span>
          </div>
        ) : (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            {t('gamification.pushNotifications.enable')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
