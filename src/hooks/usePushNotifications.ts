import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
  permissionStatus: string;
  requestPermission: () => Promise<boolean>;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      setPermissionStatus(existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(status);
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } else {
          // Fallback for development
          token = (await Notifications.getExpoPushTokenAsync()).data;
        }
      } catch (e) {
        console.log('Error getting push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Toast.show({
        type: 'error',
        text1: 'Not Supported',
        text2: 'Push notifications only work on physical devices',
      });
      return false;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        Toast.show({
          type: 'success',
          text1: 'Notifications Enabled',
          text2: 'You will receive push notifications',
        });
        return true;
      } else {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Please enable notifications in settings',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        // Show toast for foreground notifications
        Toast.show({
          type: 'info',
          text1: notification.request.content.title || 'Notification',
          text2: notification.request.content.body || '',
        });
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        // Handle notification tap - could navigate to specific screen
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // Navigate to screen based on notification data
          console.log('Navigate to:', data.screen);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    requestPermission,
  };
};

// Helper function to send local notifications
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null,
  });
};

// Schedule a reminder notification
export const scheduleReminder = async (
  title: string,
  body: string,
  date: Date
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: date,
  });
};

// Schedule daily habit reminder
export const scheduleDailyReminder = async (
  title: string,
  body: string,
  hour: number,
  minute: number
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
};
