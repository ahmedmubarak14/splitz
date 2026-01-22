import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');

  useEffect(() => {
    // Check if running on native platform
    const checkSupport = () => {
      const isNative = Capacitor.isNativePlatform();
      setIsSupported(isNative);
      return isNative;
    };

    if (!checkSupport()) return;

    // Check current permission status
    PushNotifications.checkPermissions().then(result => {
      setPermissionStatus(result.receive as string);
    });

    // Register listeners
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // Save token to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const platform = Capacitor.getPlatform();
        await supabase
          .from('push_tokens')
          .upsert({
            user_id: user.id,
            token: token.value,
            platform: platform,
            last_used: new Date().toISOString()
          });
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      toast.error('Failed to register for notifications');
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      toast.info(notification.title || 'New notification', {
        description: notification.body
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push notifications are only available on mobile devices');
      return false;
    }

    try {
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        await PushNotifications.register();
        setPermissionStatus('granted');
        toast.success('Notifications enabled!');
        return true;
      } else {
        setPermissionStatus('denied');
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  };

  return {
    isSupported,
    permissionStatus,
    requestPermission
  };
};
