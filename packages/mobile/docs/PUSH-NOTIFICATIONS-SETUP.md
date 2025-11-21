# Push Notifications Setup Guide

Complete push notification infrastructure is now set up for the Splitz app!

## Features Included

✅ Local notifications (scheduled reminders)
✅ Push notifications (from backend/server)
✅ Task reminders
✅ Habit reminders
✅ Trip notifications
✅ Badge count management
✅ Notification channels (Android)
✅ Permission handling
✅ Deep linking support

## Quick Setup

### 1. Verify Configuration

The notification icon is already configured in `app.json`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#6366f1"
      }
    ]
  ]
}
```

### 2. Request Permissions in Your App

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function App() {
  const { permissionGranted, requestPermissions } = useNotifications();

  useEffect(() => {
    // Request permissions when app starts
    if (!permissionGranted) {
      requestPermissions();
    }
  }, []);

  // ... rest of your app
}
```

## Usage Examples

### Example 1: Request Permissions (Settings Screen)

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function SettingsScreen() {
  const {
    permissionGranted,
    canAskAgain,
    requestPermissions,
    isLoading
  } = useNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermissions();

    if (granted) {
      Alert.alert('Success', 'Notifications enabled!');
    } else if (!canAskAgain) {
      Alert.alert(
        'Permissions Denied',
        'Please enable notifications in your device settings.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
      );
    }
  };

  return (
    <View>
      <Text>Enable Notifications</Text>
      <Switch value={permissionGranted} onValueChange={handleEnableNotifications} />
    </View>
  );
}
```

### Example 2: Schedule Task Reminder

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function CreateTaskScreen() {
  const { scheduleTask } = useNotifications();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());

  const handleCreateTask = async () => {
    // Create task in database
    const task = await createTask({ title, dueDate });

    // Schedule notification 1 hour before due date
    await scheduleTask(title, dueDate, task.id);

    Alert.alert('Success', 'Task created with reminder!');
  };

  return (
    <View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Task title" />
      <DatePicker value={dueDate} onChange={setDueDate} />
      <Button title="Create Task" onPress={handleCreateTask} />
    </View>
  );
}
```

### Example 3: Schedule Daily Habit Reminder

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function CreateHabitScreen() {
  const { scheduleHabit } = useNotifications();
  const [title, setTitle] = useState('');
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });

  const handleCreateHabit = async () => {
    // Create habit in database
    const habit = await createHabit({ title, reminderTime });

    // Schedule daily reminder at specified time
    await scheduleHabit(title, reminderTime, habit.id);

    Alert.alert('Success', 'Daily reminder set!');
  };

  return (
    <View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Habit title" />
      <TimePicker value={reminderTime} onChange={setReminderTime} />
      <Button title="Create Habit" onPress={handleCreateHabit} />
    </View>
  );
}
```

### Example 4: Send Immediate Notification

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function SomeScreen() {
  const { scheduleNotification } = useNotifications();

  const sendNotificationNow = async () => {
    // Send notification immediately (in 1 second)
    await scheduleNotification(
      'Hello!',
      'This is an immediate notification',
      1, // seconds from now
      { customData: 'value' }
    );
  };

  return <Button title="Send Notification" onPress={sendNotificationNow} />;
}
```

### Example 5: Manage Badge Count

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function TasksScreen() {
  const { updateBadge } = useNotifications();
  const { data: tasks } = useTasks();

  useEffect(() => {
    // Update badge with count of incomplete tasks
    const incompleteTasks = tasks?.filter(t => !t.is_completed).length || 0;
    updateBadge(incompleteTasks);
  }, [tasks]);

  // ... rest of component
}
```

### Example 6: Cancel Notification

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function TaskDetailScreen({ taskId }) {
  const { cancel } = useNotifications();
  const [notificationId, setNotificationId] = useState<string | null>(null);

  const handleDeleteTask = async () => {
    // Delete task from database
    await deleteTask(taskId);

    // Cancel associated notification
    if (notificationId) {
      await cancel(notificationId);
    }
  };

  return <Button title="Delete Task" onPress={handleDeleteTask} />;
}
```

## Notification Channels (Android)

The app creates these channels automatically:

| Channel ID | Name | Importance | Use Case |
|------------|------|------------|----------|
| `default` | Default | MAX | General notifications |
| `tasks` | Task Reminders | HIGH | Task due reminders |
| `habits` | Habit Reminders | HIGH | Daily habit reminders |
| `trips` | Trip Notifications | DEFAULT | Trip updates |

## Push Notifications from Backend

### 1. Get User's Push Token

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function ProfileScreen() {
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      // Send token to your backend
      sendTokenToBackend(expoPushToken);
    }
  }, [expoPushToken]);
}
```

### 2. Send Push from Backend

**Using Expo's Push API:**

```typescript
// Backend code (Node.js example)
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(pushToken: string, title: string, body: string) {
  const messages = [{
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { customData: 'value' },
    channelId: 'default', // Android only
  }];

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log(receipts);
    } catch (error) {
      console.error(error);
    }
  }
}
```

**Using HTTP API:**

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Hello!",
  "body": "This is a push notification",
  "data": { "userId": "123" }
}'
```

## Deep Linking

When user taps notification, handle the navigation:

```tsx
// In your root navigator or App.tsx
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigation } from '@react-navigation/native';

function RootNavigator() {
  const { notification } = useNotifications();
  const navigation = useNavigation();

  useEffect(() => {
    if (notification?.request.content.data) {
      const { type, taskId, habitId, tripId } = notification.request.content.data;

      // Navigate based on notification type
      if (type === 'task' && taskId) {
        navigation.navigate('TaskDetail', { taskId });
      } else if (type === 'habit' && habitId) {
        navigation.navigate('HabitDetail', { habitId });
      } else if (type === 'trip' && tripId) {
        navigation.navigate('TripDetail', { tripId });
      }
    }
  }, [notification]);

  // ... rest of navigator
}
```

## Testing

### Testing on iOS Simulator:
- Local notifications work ✅
- Push notifications DON'T work ❌ (need physical device)

### Testing on Android Emulator:
- Local notifications work ✅
- Push notifications work ✅ (with Google Play Services)

### Testing on Physical Device:
1. Build the app with EAS
2. Install on device
3. Grant notification permissions
4. Schedule a notification and wait
5. Or send push from backend using the token

### Quick Local Test:
```tsx
// Schedule notification in 5 seconds
await scheduleNotification('Test', 'Testing notifications!', 5);
```

## Troubleshooting

**"Notifications don't appear"**
- Check permissions are granted
- Verify device supports notifications
- Check notification channels (Android)
- Look at console logs for errors

**"Push token is null"**
- Ensure EAS projectId is configured in app.json
- Check if running on physical device
- Verify permissions are granted

**"Notifications appear but can't tap"**
- Check notification data structure
- Verify deep linking setup
- Look for errors in response handler

**"Sound doesn't play"**
- Check device is not in silent mode
- Verify sound settings in notification config
- Check channel settings (Android)

## Best Practices

### ✅ DO:
- Request permissions contextually (not immediately on app start)
- Store notification IDs with your data (tasks, habits, etc.)
- Cancel notifications when items are deleted
- Update badge count to reflect app state
- Test on physical devices before release
- Handle notification tap events properly

### ❌ DON'T:
- Don't spam users with too many notifications
- Don't request permissions without explanation
- Don't forget to cancel notifications for deleted items
- Don't assume notifications will always work
- Don't send sensitive data in notification content

## Production Checklist

- [ ] Configure EAS projectId in app.json
- [ ] Create notification icon (96x96, monochrome)
- [ ] Test permissions flow
- [ ] Test local notifications
- [ ] Set up backend to receive push tokens
- [ ] Test push notifications from backend
- [ ] Implement deep linking for notification taps
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Add analytics for notification engagement
- [ ] Implement user preferences for notification types

## Next Steps

1. **Customize notification appearance**: Edit channel settings and notification content
2. **Add rich notifications**: Include images, actions, or custom layouts
3. **Implement notification preferences**: Let users choose what they want to be notified about
4. **Track engagement**: Add analytics to measure notification effectiveness
5. **A/B test timing**: Find optimal times to send reminders

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [expo-server-sdk](https://github.com/expo/expo-server-sdk-node)
