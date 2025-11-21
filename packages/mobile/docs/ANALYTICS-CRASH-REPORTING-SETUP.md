# Analytics & Crash Reporting Setup Guide

Complete monitoring infrastructure for production app!

## What's Included

✅ **Analytics Service** - Track user behavior and app usage
✅ **Crash Reporting** - Capture and report crashes with Sentry
✅ **Error Tracking** - Log non-fatal errors
✅ **Performance Monitoring** - Track app performance
✅ **User Context** - Associate events with users
✅ **Breadcrumbs** - Trace user actions before crashes

## Part 1: Sentry Crash Reporting

### 1. Get Sentry DSN

1. Go to https://sentry.io and create account
2. Create new project → React Native
3. Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### 2. Configure Sentry

Create `packages/mobile/.env`:
```env
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
EXPO_PUBLIC_ENVIRONMENT=production
```

### 3. Initialize in App.tsx

```tsx
import { crashReporting } from '@/services/crashReporting';
import { analytics } from '@/services/analyticsService';
import Constants from 'expo-constants';

// Initialize crash reporting
useEffect(() => {
  crashReporting.initialize({
    dsn: Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    environment: __DEV__ ? 'development' : 'production',
    enableInDev: false, // Set to true to test in development
    tracesSampleRate: 1.0, // 100% of transactions for performance monitoring
    enableAutoSessionTracking: true,
  });

  // Initialize analytics
  analytics.initialize();
}, []);
```

### 4. Set User Context on Login

```tsx
import { crashReporting } from '@/services/crashReporting';
import { analytics } from '@/services/analyticsService';

// In your AuthContext after successful login
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.user) {
    // Set user context for crash reporting
    crashReporting.setUser({
      id: data.user.id,
      email: data.user.email,
    });

    // Set user context for analytics
    analytics.setUserId(data.user.id);
    analytics.setUserProperties({
      email: data.user.email,
      signupDate: new Date(data.user.created_at),
    });

    // Track login event
    analytics.trackLogin('email');
  }

  return { error: error as Error | null };
};
```

### 5. Clear User Context on Logout

```tsx
const signOut = async () => {
  await supabase.auth.signOut();

  // Clear user context
  crashReporting.clearUser();
  analytics.setUserId(null);

  // Track logout
  analytics.trackLogout();
};
```

## Part 2: Analytics Integration

### Option A: Firebase Analytics (Recommended)

#### Install Firebase
```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

#### Configure
Add to `analyticsService.ts`:
```typescript
import analytics from '@react-native-firebase/analytics';

async initialize(): Promise<void> {
  await analytics().setAnalyticsCollectionEnabled(true);
  console.log('📊 Firebase Analytics initialized');
}

trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (!this.isEnabled) return;
  analytics().logEvent(eventName, properties);
}
```

### Option B: Amplitude

#### Install Amplitude
```bash
npm install @amplitude/react-native @react-native-async-storage/async-storage
```

#### Configure
```typescript
import { Amplitude } from '@amplitude/react-native';

const amplitude = Amplitude.getInstance();

async initialize(): Promise<void> {
  amplitude.init(process.env.AMPLITUDE_API_KEY);
  console.log('📊 Amplitude initialized');
}

trackEvent(eventName: string, properties?: Record<string, any>): void {
  amplitude.logEvent(eventName, properties);
}
```

### Option C: Mixpanel

#### Install Mixpanel
```bash
npm install mixpanel-react-native
```

#### Configure
```typescript
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel(process.env.MIXPANEL_TOKEN);

async initialize(): Promise<void> {
  await mixpanel.init();
  console.log('📊 Mixpanel initialized');
}
```

## Usage Examples

### Example 1: Track Screen Views

```tsx
import { analytics } from '@/services/analyticsService';
import { useEffect } from 'react';

function TasksScreen() {
  useEffect(() => {
    analytics.trackScreenView('Tasks');
  }, []);

  return <View>{/* Screen content */}</View>;
}
```

### Example 2: Track Custom Events

```tsx
import { analytics } from '@/services/analyticsService';

function CreateTaskButton() {
  const handleCreateTask = async (taskData) => {
    // Create task
    const task = await createTask(taskData);

    // Track event
    analytics.trackTaskCreated({
      priority: taskData.priority,
      hasDueDate: !!taskData.dueDate,
    });
  };

  return <Button title="Create Task" onPress={handleCreateTask} />;
}
```

### Example 3: Capture Errors

```tsx
import { crashReporting } from '@/services/crashReporting';

function TaskList() {
  const fetchTasks = async () => {
    try {
      const tasks = await api.getTasks();
      setTasks(tasks);
    } catch (error) {
      // Capture error with context
      crashReporting.captureError(error as Error, {
        action: 'fetch_tasks',
        userId: user?.id,
      });

      // Show user-friendly message
      Toast.show({
        type: 'error',
        text1: 'Failed to load tasks',
      });
    }
  };

  return <FlatList data={tasks} />;
}
```

### Example 4: Add Breadcrumbs

```tsx
import { crashReporting } from '@/services/crashReporting';

function TaskDetailScreen({ taskId }) {
  useEffect(() => {
    // Add breadcrumb for debugging
    crashReporting.addBreadcrumb({
      message: 'Viewed task detail',
      category: 'navigation',
      level: 'info',
      data: { taskId },
    });
  }, [taskId]);

  return <View>{/* Task details */}</View>;
}
```

### Example 5: Track Performance

```tsx
import { crashReporting, analytics } from '@/services';

async function expensiveOperation() {
  // Start performance tracking
  const transaction = crashReporting.startTransaction(
    'data_sync',
    'task'
  );

  const startTime = Date.now();

  try {
    await syncDataWithServer();

    // Track success
    const duration = Date.now() - startTime;
    analytics.trackPerformance('data_sync', duration, 'ms');
  } catch (error) {
    crashReporting.captureError(error);
  } finally {
    transaction?.finish();
  }
}
```

### Example 6: Track Settings Changes

```tsx
import { analytics } from '@/services/analyticsService';

function SettingsScreen() {
  const handleToggleNotifications = (enabled: boolean) => {
    // Update setting
    updateNotificationSettings(enabled);

    // Track change
    analytics.trackSettingsChanged('notifications', enabled);
  };

  return (
    <Switch
      value={notificationsEnabled}
      onValueChange={handleToggleNotifications}
    />
  );
}
```

### Example 7: Auto-track Navigation (Sentry)

In your navigation container:

```tsx
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

const navigationIntegration = Sentry.reactNavigationIntegration();

function App() {
  const navigationRef = React.useRef(null);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        navigationIntegration.registerNavigationContainer(navigationRef);
      }}
    >
      {/* Your navigators */}
    </NavigationContainer>
  );
}
```

## Pre-defined Analytics Events

The analytics service includes ready-to-use tracking methods:

| Method | Description | Properties |
|--------|-------------|------------|
| `trackSignup(method)` | User creates account | method: email/google/apple |
| `trackLogin(method)` | User logs in | method: email/google/apple/biometric |
| `trackLogout()` | User logs out | - |
| `trackTaskCreated(data)` | Task created | priority, hasDueDate |
| `trackTaskCompleted(id)` | Task marked complete | taskId |
| `trackHabitCreated(data)` | Habit created | frequency, hasReminder |
| `trackHabitCheckedIn(id, streak)` | Habit checked in | habitId, streak |
| `trackExpenseCreated(data)` | Expense added | amount, category |
| `trackSearch(query, count)` | Search performed | query, resultsCount |
| `trackFeatureUsed(name)` | Feature accessed | feature name |

## Best Practices

### ✅ DO:
- Initialize crash reporting early in app lifecycle
- Set user context after authentication
- Clear user context on logout
- Add breadcrumbs for important actions
- Track feature usage for product insights
- Use descriptive event names
- Include relevant context with errors
- Monitor performance metrics

### ❌ DON'T:
- Don't log sensitive user data (passwords, tokens)
- Don't track PII without consent
- Don't send too many events (expensive)
- Don't forget to test in production
- Don't ignore error reports
- Don't track every single action

## Privacy & GDPR Compliance

### User Consent

```tsx
function PrivacySettings() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleToggleAnalytics = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    analytics.setEnabled(enabled);

    // Save preference
    await AsyncStorage.setItem('analytics_enabled', enabled.toString());
  };

  return (
    <View>
      <Text>Share anonymous usage data</Text>
      <Switch value={analyticsEnabled} onValueChange={handleToggleAnalytics} />
    </View>
  );
}
```

### Data Deletion

When user deletes account, ensure:
1. Clear crash reporting user context
2. Clear analytics user ID
3. Stop all tracking
4. Remove any locally stored analytics data

## Testing

### Test Crash Reporting (Development)

```tsx
import { crashReporting } from '@/services/crashReporting';

// Add test button in development
{__DEV__ && (
  <Button
    title="Test Crash Reporting"
    onPress={() => crashReporting.testCrash()}
  />
)}
```

### Test Analytics (Development)

```tsx
import { analytics } from '@/services/analyticsService';

// Track test event
analytics.trackEvent('test_event', { test: true });

// Check console logs for confirmation
```

### Verify in Production

1. **Sentry**: Go to sentry.io → Issues → See crashes
2. **Firebase**: Firebase Console → Analytics → Events
3. **Amplitude**: Amplitude Dashboard → User Activity
4. **Mixpanel**: Mixpanel Dashboard → Events

## Monitoring Checklist

- [ ] Sentry DSN configured
- [ ] Crash reporting initialized in App.tsx
- [ ] User context set on login
- [ ] User context cleared on logout
- [ ] Analytics provider chosen and configured
- [ ] Key events tracked (signup, login, core features)
- [ ] Screen views tracked
- [ ] Error handling implemented
- [ ] Breadcrumbs added for critical flows
- [ ] Performance monitoring enabled
- [ ] Privacy policy updated with analytics disclosure
- [ ] User consent mechanism (if required by region)
- [ ] Tested in development
- [ ] Verified in production

## App Store Requirements

### Apple App Store
- Disclose data collection in App Privacy section
- List types of data collected (usage data, identifiers)
- State if data is linked to user identity
- Provide link to privacy policy

### Google Play Store
- Complete Data Safety section
- Declare analytics and crash reporting SDKs
- State data handling practices
- Link to privacy policy

## Common Issues

**"Sentry not capturing crashes"**
- Verify DSN is correct
- Check initialization happens early
- Ensure native crash handling enabled
- Rebuild app after adding Sentry

**"No analytics events showing"**
- Verify API key/credentials correct
- Check network connectivity
- Look for console errors
- Events may have delay (5-30 mins)

**"Too many events/quota exceeded"**
- Reduce sampling rate
- Track only important events
- Implement client-side filtering
- Upgrade plan if needed

## Cost Estimates

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Sentry** | 5K errors/month | $26/month for 50K |
| **Firebase** | Unlimited | Free |
| **Amplitude** | 10M events/month | $49/month+ |
| **Mixpanel** | 20M events/month | $25/month+ |

## Next Steps

1. **Set up alerts**: Get notified of critical errors
2. **Create dashboards**: Monitor key metrics
3. **Set up releases**: Track errors by version
4. **A/B testing**: Use analytics for experiments
5. **Funnels**: Track conversion flows
6. **Cohort analysis**: Understand user retention

## Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Firebase Analytics](https://rnfirebase.io/analytics/usage)
- [Amplitude React Native](https://www.docs.developers.amplitude.com/data/sdks/react-native/)
- [Mixpanel React Native](https://github.com/mixpanel/mixpanel-react-native)
