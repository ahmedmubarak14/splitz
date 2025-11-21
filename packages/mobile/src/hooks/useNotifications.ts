import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  getNotificationPermissions,
  requestNotificationPermissions,
  scheduleLocalNotification,
  scheduleTaskReminder,
  scheduleHabitReminder,
  scheduleTripReminder,
  cancelNotification,
  cancelAllNotifications,
  getAllScheduledNotifications,
  clearAllNotifications,
  setBadgeCount,
  getBadgeCount,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from '@/services/notificationService';

/**
 * React Hook for Push Notifications
 * Provides easy access to notification functionality in components
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<Notifications.Notification | null>(
    null
  );

  // Load notification permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listener for user tapping on notification
    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);
      handleNotificationResponse(response);
    });

    return () => {
      removeNotificationSubscription(receivedSubscription);
      removeNotificationSubscription(responseSubscription);
    };
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const permissions = await getNotificationPermissions();
      setPermissionGranted(permissions.granted);
      setCanAskAgain(permissions.canAskAgain);

      // If permissions already granted, register for push
      if (permissions.granted) {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);
      }
    } catch (error) {
      console.error('Error loading notification permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);

      if (granted) {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const scheduleNotification = useCallback(
    async (
      title: string,
      body: string,
      trigger: Date | number | Notifications.NotificationTriggerInput,
      data?: Record<string, any>,
      channelId?: string
    ): Promise<string | null> => {
      try {
        if (!permissionGranted) {
          console.log('Notification permission not granted');
          return null;
        }

        return await scheduleLocalNotification(title, body, trigger, data, channelId);
      } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
      }
    },
    [permissionGranted]
  );

  const scheduleTask = useCallback(
    async (taskTitle: string, dueDate: Date, taskId: string): Promise<string | null> => {
      try {
        if (!permissionGranted) return null;
        return await scheduleTaskReminder(taskTitle, dueDate, taskId);
      } catch (error) {
        console.error('Error scheduling task reminder:', error);
        return null;
      }
    },
    [permissionGranted]
  );

  const scheduleHabit = useCallback(
    async (
      habitTitle: string,
      time: { hour: number; minute: number },
      habitId: string
    ): Promise<string | null> => {
      try {
        if (!permissionGranted) return null;
        return await scheduleHabitReminder(habitTitle, time, habitId);
      } catch (error) {
        console.error('Error scheduling habit reminder:', error);
        return null;
      }
    },
    [permissionGranted]
  );

  const scheduleTrip = useCallback(
    async (
      tripTitle: string,
      startDate: Date,
      tripId: string
    ): Promise<string | null> => {
      try {
        if (!permissionGranted) return null;
        return await scheduleTripReminder(tripTitle, startDate, tripId);
      } catch (error) {
        console.error('Error scheduling trip reminder:', error);
        return null;
      }
    },
    [permissionGranted]
  );

  const cancel = useCallback(async (notificationId: string): Promise<void> => {
    await cancelNotification(notificationId);
  }, []);

  const cancelAll = useCallback(async (): Promise<void> => {
    await cancelAllNotifications();
  }, []);

  const getScheduled = useCallback(async (): Promise<Notifications.NotificationRequest[]> => {
    return await getAllScheduledNotifications();
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    await clearAllNotifications();
  }, []);

  const updateBadge = useCallback(async (count: number): Promise<void> => {
    await setBadgeCount(count);
  }, []);

  const getBadge = useCallback(async (): Promise<number> => {
    return await getBadgeCount();
  }, []);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    if (data.type === 'task') {
      // Navigate to task detail
      console.log('Navigate to task:', data.taskId);
    } else if (data.type === 'habit') {
      // Navigate to habit detail
      console.log('Navigate to habit:', data.habitId);
    } else if (data.type === 'trip') {
      // Navigate to trip detail
      console.log('Navigate to trip:', data.tripId);
    }

    // You can implement navigation logic here
    // e.g., navigation.navigate('TaskDetail', { taskId: data.taskId });
  };

  return {
    // State
    expoPushToken,
    permissionGranted,
    canAskAgain,
    isLoading,
    notification,

    // Actions
    requestPermissions,
    scheduleNotification,
    scheduleTask,
    scheduleHabit,
    scheduleTrip,
    cancel,
    cancelAll,
    getScheduled,
    clearAll,
    updateBadge,
    getBadge,
    refresh: loadPermissions,
  };
}
