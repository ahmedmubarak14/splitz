# Offline Support Setup Guide

The Splitz app now has comprehensive offline support with data persistence and sync capabilities!

## Features

✅ Offline-first data caching
✅ Automatic data persistence
✅ Offline queue for pending actions
✅ Auto-sync when back online
✅ Network status detection
✅ Smart cache management
✅ Optimistic updates

## Installation

### 1. Install Required Packages

```bash
cd packages/mobile

# Install dependencies
npx expo install @react-native-community/netinfo
npm install @tanstack/react-query-persist-client
npm install @tanstack/query-async-storage-persister
```

### 2. Update App.tsx with Persistence

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createOfflineQueryClient, persistOptions } from '@/utils/reactQueryPersister';

// Create query client with offline support
const queryClient = createOfflineQueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
          >
            <AuthProvider>
              <RootNavigator />
              <StatusBar style="auto" />
              <Toast />
            </AuthProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

## How It Works

### Data Flow

```
┌─────────────────────────────────────────────────┐
│                 User Action                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Online?      │
         └────────┬───────┘
                  │
         ┌────────┴───────┐
         │                │
         ▼                ▼
    ┌─────────┐      ┌─────────┐
    │  Yes    │      │   No    │
    └────┬────┘      └────┬────┘
         │                │
         ▼                ▼
  ┌────────────┐    ┌────────────┐
  │ Sync to    │    │ Add to     │
  │ Server     │    │ Queue      │
  └────┬───────┘    └────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
         ┌────────────┐
         │ Update     │
         │ Local      │
         │ Cache      │
         └────────────┘
```

## Usage Examples

### Example 1: Display Network Status

```tsx
import { useOffline } from '@/hooks/useOffline';

function Header() {
  const { isConnected, isOffline, queueSize } = useOffline();

  return (
    <View>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text>📡 You're offline</Text>
          {queueSize > 0 && <Text>{queueSize} actions pending</Text>}
        </View>
      )}
      {/* Rest of header */}
    </View>
  );
}
```

### Example 2: Manual Sync Button

```tsx
import { useOffline } from '@/hooks/useOffline';

function SettingsScreen() {
  const {
    isConnected,
    isSyncing,
    lastSync,
    queueSize,
    syncOfflineQueue,
  } = useOffline();

  const handleSync = async () => {
    const result = await syncOfflineQueue();
    Alert.alert(
      'Sync Complete',
      `Synced: ${result.success}, Failed: ${result.failed}`
    );
  };

  return (
    <View>
      <Text>Network Status: {isConnected ? 'Online' : 'Offline'}</Text>
      <Text>Pending Actions: {queueSize}</Text>
      {lastSync && <Text>Last Sync: {lastSync.toLocaleString()}</Text>}

      <Button
        title={isSyncing ? 'Syncing...' : 'Sync Now'}
        onPress={handleSync}
        disabled={!isConnected || isSyncing}
      />
    </View>
  );
}
```

### Example 3: Create Task (Online/Offline)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToOfflineQueue } from '@/utils/offlineStorage';
import { useOffline } from '@/hooks/useOffline';

function CreateTaskScreen() {
  const queryClient = useQueryClient();
  const { canSync } = useOffline();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      if (canSync()) {
        // Online: Send to server
        return await api.createTask(taskData);
      } else {
        // Offline: Add to queue
        await addToOfflineQueue({
          type: 'create',
          entity: 'task',
          data: taskData,
        });

        // Return optimistic response
        return { ...taskData, id: `temp_${Date.now()}` };
      }
    },
    onSuccess: () => {
      // Invalidate tasks query to refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateTask = (taskData) => {
    createTaskMutation.mutate(taskData);
  };

  return (
    <View>
      {/* Task form */}
      <Button title="Create Task" onPress={() => handleCreateTask(data)} />
    </View>
  );
}
```

### Example 4: Cache Management

```tsx
import { useOffline } from '@/hooks/useOffline';

function StorageSettingsScreen() {
  const { cleanCache, getFormattedCacheSize } = useOffline();
  const [cacheSize, setCacheSize] = useState('0 B');

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await getFormattedCacheSize();
    setCacheSize(size);
  };

  const handleClearCache = async () => {
    const cleared = await cleanCache();
    Alert.alert('Cache Cleared', `Removed ${cleared} expired entries`);
    await loadCacheSize();
  };

  return (
    <View>
      <Text>Cache Size: {cacheSize}</Text>
      <Button title="Clear Expired Cache" onPress={handleClearCache} />
    </View>
  );
}
```

### Example 5: Optimistic Updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function TaskItem({ task }) {
  const queryClient = useQueryClient();

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      // This will work even offline thanks to networkMode: 'offlineFirst'
      return await api.toggleTask(taskId);
    },
    // Optimistic update
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: any) =>
        old.map((t: any) =>
          t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
        )
      );

      // Return context with snapshot
      return { previousTasks };
    },
    // If mutation fails, roll back
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      Toast.show({ type: 'error', text1: 'Failed to update task' });
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <TouchableOpacity onPress={() => toggleTaskMutation.mutate(task.id)}>
      <Text>{task.title}</Text>
      <Checkbox checked={task.is_completed} />
    </TouchableOpacity>
  );
}
```

## React Query Configuration

The offline QueryClient is pre-configured with:

```typescript
{
  queries: {
    gcTime: 24 hours,           // Cache for 24 hours
    staleTime: 5 minutes,       // Fresh for 5 minutes
    retry: 3,                   // Retry failed queries 3 times
    networkMode: 'offlineFirst', // Cache-first strategy
    refetchOnReconnect: true,   // Refetch when back online
  },
  mutations: {
    retry: 3,
    networkMode: 'offlineFirst',
  }
}
```

## Offline Queue

When offline, actions are queued and automatically processed when back online.

### Queue Structure

```typescript
interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'habit' | 'expense' | 'trip';
  data: any;
  timestamp: number;
  retryCount: number; // Max 3 retries
}
```

### Manual Queue Management

```typescript
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from '@/utils/offlineStorage';

// Add to queue
await addToOfflineQueue({
  type: 'create',
  entity: 'task',
  data: taskData,
});

// Get queue
const queue = await getOfflineQueue();

// Remove from queue
await removeFromOfflineQueue(actionId);

// Clear entire queue
await clearOfflineQueue();
```

## Cache Management

### Set Cache

```typescript
import { setCachedData } from '@/utils/offlineStorage';

await setCachedData('tasks', tasksArray, 3600000); // 1 hour TTL
```

### Get Cache

```typescript
import { getCachedData } from '@/utils/offlineStorage';

const tasks = await getCachedData('tasks');
```

### Clear Cache

```typescript
import { clearCachedData } from '@/utils/offlineStorage';

// Clear specific cache
await clearCachedData('tasks');

// Clear all cache
await clearCachedData();
```

## Testing Offline Functionality

### iOS Simulator
1. **Airplane Mode**: Settings → Airplane Mode → ON
2. **Network Link Conditioner**: Download from Apple, simulate poor network
3. **Physical Device**: Toggle airplane mode

### Android Emulator
1. Emulator menu → Network status → None
2. Or: `adb shell svc wifi disable` / `enable`
3. Extended controls → Cellular → Data status → Off

### Testing Checklist
- [ ] Create data while offline
- [ ] Update data while offline
- [ ] Delete data while offline
- [ ] Go back online and verify auto-sync
- [ ] Test queue persistence across app restarts
- [ ] Test cache expiration
- [ ] Test optimistic updates
- [ ] Test error recovery

## Best Practices

### ✅ DO:
- Use optimistic updates for better UX
- Show offline indicators clearly
- Display pending queue size
- Auto-sync when back online
- Implement retry logic with exponential backoff
- Clear expired cache periodically
- Handle conflicts gracefully

### ❌ DON'T:
- Don't assume network is always available
- Don't lose user data when offline
- Don't show errors for offline operations
- Don't retry indefinitely (max 3 times)
- Don't cache sensitive data without encryption
- Don't forget to test offline scenarios

## Conflict Resolution

When syncing, conflicts may occur. Here's a simple strategy:

```typescript
async function resolveConflict(local: any, remote: any) {
  // Last-write-wins strategy
  if (local.updated_at > remote.updated_at) {
    return local; // Keep local changes
  } else {
    return remote; // Use server version
  }
}
```

For critical data, implement proper conflict resolution:
- Show conflict UI to user
- Let user choose which version to keep
- Merge changes intelligently

## Performance Tips

1. **Limit cache size**: Clear old data regularly
2. **Selective persistence**: Only cache important queries
3. **Throttle saves**: Already configured (1 second throttle)
4. **Compress data**: Use compression for large datasets
5. **Background sync**: Sync in background for better UX

## Troubleshooting

**"Data not persisting"**
- Check AsyncStorage permissions
- Verify persistOptions configuration
- Look for console errors

**"Queue not processing"**
- Check network connectivity
- Verify processor function is correct
- Check for errors in sync logic

**"Cache too large"**
- Run `cleanCache()` regularly
- Reduce gcTime in query config
- Be selective about what to cache

**"Optimistic updates reverting"**
- Ensure onMutate returns context
- Check onError is using context to rollback
- Verify mutation is properly configured

## Next Steps

1. **Implement conflict resolution**: Handle edge cases when data conflicts
2. **Add sync indicators**: Show progress during sync
3. **Background sync**: Use background tasks for large syncs
4. **Compression**: Compress cached data to save space
5. **Encryption**: Encrypt sensitive cached data
6. **Analytics**: Track offline usage patterns

## Resources

- [React Query Persistence](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient)
- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [AsyncStorage Guide](https://react-native-async-storage.github.io/async-storage/)
