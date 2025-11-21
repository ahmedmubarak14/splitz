import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Push Notification Service
 * Handles registration, scheduling, and management of notifications
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
}

/**
 * Register for push notifications and get Expo push token
 * This token is used to send notifications from your backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, ask for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('Project ID not found. Please configure EAS in app.json');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Android specific configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });

      // Create additional channels for different notification types
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f093fb',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('trips', {
        name: 'Trip Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#f5576c',
      });
    }

    console.log('Push token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Check notification permissions
 */
export async function getNotificationPermissions(): Promise<NotificationPermissions> {
  const { status, canAskAgain, ios } = await Notifications.getPermissionsAsync();

  return {
    granted: status === 'granted',
    canAskAgain,
    ios: ios
      ? {
          allowsAlert: ios.allowsAlert,
          allowsBadge: ios.allowsBadge,
          allowsSound: ios.allowsSound,
        }
      : undefined,
  };
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Date | number | Notifications.NotificationTriggerInput,
  data?: Record<string, any>,
  channelId: string = 'default'
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger:
        typeof trigger === 'number'
          ? { seconds: trigger }
          : trigger instanceof Date
          ? { date: trigger }
          : trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Schedule a task reminder
 */
export async function scheduleTaskReminder(
  taskTitle: string,
  dueDate: Date,
  taskId: string
): Promise<string> {
  const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour before

  if (reminderTime < new Date()) {
    throw new Error('Reminder time is in the past');
  }

  return await scheduleLocalNotification(
    'Task Due Soon',
    `"${taskTitle}" is due in 1 hour`,
    reminderTime,
    { type: 'task', taskId },
    'tasks'
  );
}

/**
 * Schedule a daily habit reminder
 */
export async function scheduleHabitReminder(
  habitTitle: string,
  time: { hour: number; minute: number },
  habitId: string
): Promise<string> {
  return await scheduleLocalNotification(
    'Habit Reminder',
    `Time to complete "${habitTitle}"`,
    {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    },
    { type: 'habit', habitId },
    'habits'
  );
}

/**
 * Schedule a trip reminder
 */
export async function scheduleTripReminder(
  tripTitle: string,
  startDate: Date,
  tripId: string
): Promise<string> {
  const reminderTime = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before

  if (reminderTime < new Date()) {
    throw new Error('Reminder time is in the past');
  }

  return await scheduleLocalNotification(
    'Trip Starting Soon',
    `"${tripTitle}" starts tomorrow!`,
    reminderTime,
    { type: 'trip', tripId },
    'trips'
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Clear all delivered notifications (from notification center)
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
}

/**
 * Get badge count (iOS)
 */
export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === 'ios') {
    return await Notifications.getBadgeCountAsync();
  }
  return 0;
}

/**
 * Add notification received listener
 * Called when notification is received while app is in foreground
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener
 * Called when user taps on notification
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Remove notification listener
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}
