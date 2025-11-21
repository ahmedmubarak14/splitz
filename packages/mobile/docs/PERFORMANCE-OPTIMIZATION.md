# Performance & Bundle Size Optimization Guide

Make your app fast, lightweight, and efficient for production.

## Current Configuration

The app is already optimized with:
- ✅ React Query for efficient data caching
- ✅ NativeWind for optimized styling
- ✅ React Navigation for native navigation performance
- ✅ Expo for optimized builds
- ✅ Error boundaries to prevent full crashes
- ✅ Lazy loading where appropriate

## Performance Goals

| Metric | Target | Critical |
|--------|--------|----------|
| Initial load time | < 2 seconds | < 3 seconds |
| App bundle size (iOS) | < 30 MB | < 50 MB |
| App bundle size (Android) | < 25 MB | < 40 MB |
| Memory usage | < 150 MB | < 250 MB |
| JavaScript bundle | < 5 MB | < 10 MB |
| Frame rate (scrolling) | 60 FPS | > 45 FPS |
| API response time | < 500ms | < 1000ms |

## Bundle Size Optimization

### 1. Analyze Bundle Size

```bash
# Check current bundle size
eas build --platform ios --profile production --local
eas build --platform android --profile production --local

# Analyze JavaScript bundle
npx react-native-bundle-visualizer
```

### 2. Remove Unused Dependencies

Check and remove any unused packages:

```bash
# Find unused dependencies
npx depcheck

# Remove unused packages
npm uninstall <package-name>
```

### 3. Optimize Images

**Before production:**
- Convert PNG to WebP where possible
- Compress all images with tools like TinyPNG
- Use appropriate resolution (don't use 4K images)
- Use SVG for icons instead of PNG

```bash
# Install image optimizer
npm install -g imagemin-cli

# Optimize images
imagemin assets/**/*.png --out-dir=assets/optimized
```

### 4. Enable Hermes (Already enabled in Expo 51)

Hermes is automatically enabled for better performance:
- Smaller bundle size
- Faster app start
- Lower memory usage

### 5. Tree Shaking

Ensure imports are tree-shakeable:

```typescript
// ❌ Bad (imports everything)
import * as Icons from '@expo/vector-icons';

// ✅ Good (imports only what you need)
import { Ionicons } from '@expo/vector-icons';

// ❌ Bad
import lodash from 'lodash';

// ✅ Good
import debounce from 'lodash/debounce';
```

### 6. Code Splitting & Lazy Loading

Lazy load screens that aren't immediately needed:

```typescript
import React, { lazy, Suspense } from 'react';

// Lazy load heavy screens
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const MatrixScreen = lazy(() => import('./screens/MatrixScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SettingsScreen />
    </Suspense>
  );
}
```

### 7. Remove Console Logs

```bash
# Use babel plugin to remove console logs in production
npm install --save-dev babel-plugin-transform-remove-console
```

Add to `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      // Remove console logs in production
      ...(__DEV__ ? [] : ['transform-remove-console']),
    ],
  };
};
```

### 8. Asset Optimization in app.json

```json
{
  "expo": {
    "assetBundlePatterns": [
      "assets/images/**/*",
      "assets/fonts/**/*"
    ],
    "packagerOpts": {
      "config": "metro.config.js"
    }
  }
}
```

---

## Performance Optimization

### 1. Optimize FlatList / ScrollView

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={tasks}
  renderItem={renderTask}
  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  // Use key extractor
  keyExtractor={(item) => item.id}
  // Memoize render function
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 2. Memoization

Use React.memo and useMemo to prevent unnecessary re-renders:

```typescript
import React, { memo, useMemo, useCallback } from 'react';

// Memoize component
const TaskItem = memo(({ task, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(task.id)}>
      <Text>{task.title}</Text>
    </TouchableOpacity>
  );
});

// Memoize expensive calculations
function TaskList({ tasks }) {
  const sortedTasks = useMemo(() => {
    return tasks.sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  // Memoize callbacks
  const handlePress = useCallback((taskId) => {
    console.log('Task pressed:', taskId);
  }, []);

  return <FlatList data={sortedTasks} renderItem={...} />;
}
```

### 3. Optimize Images

```typescript
import { Image } from 'expo-image';

// Use expo-image for better performance
<Image
  source={{ uri: profilePictureUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={1000}
  cachePolicy="memory-disk"
/>

// Preload critical images
await Image.prefetch([
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
]);
```

### 4. Debounce Search & Input

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

function SearchScreen() {
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      // Perform search
      searchTasks(query);
    }, 300),
    []
  );

  return (
    <TextInput
      onChangeText={debouncedSearch}
      placeholder="Search tasks..."
    />
  );
}
```

### 5. Optimize Animations

Use React Native Reanimated for smooth 60fps animations:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedComponent() {
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(offset.value * 255) }],
    };
  });

  return <Animated.View style={animatedStyles} />;
}
```

### 6. Reduce API Calls

```typescript
// Use React Query for caching
const { data: tasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// Batch multiple updates
const updateMultipleTasks = async (taskUpdates) => {
  return await Promise.all(
    taskUpdates.map(update => updateTask(update))
  );
};
```

### 7. Optimize Navigation

```typescript
// Preload screens
import { useNavigation } from '@react-navigation/native';

function HomeScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Preload next screen
    navigation.preload('TaskDetail');
  }, []);
}
```

### 8. Reduce Re-renders

```typescript
// Use separate state for independent values
❌ const [state, setState] = useState({ name: '', email: '' });

✅ const [name, setName] = useState('');
✅ const [email, setEmail] = useState('');

// Use React.memo for components
const TaskItem = React.memo(({ task }) => {
  return <View>...</View>;
}, (prevProps, nextProps) => {
  // Only re-render if task changed
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.is_completed === nextProps.task.is_completed;
});
```

---

## Memory Management

### 1. Cleanup Side Effects

```typescript
useEffect(() => {
  const subscription = subscribeToData();

  // Cleanup on unmount
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 2. Clear Cached Data

```typescript
import { clearCachedData } from '@/utils/offlineStorage';

// Clear old cache periodically
useEffect(() => {
  const clearOldCache = async () => {
    await clearCachedData();
  };

  clearOldCache();

  const interval = setInterval(clearOldCache, 24 * 60 * 60 * 1000); // Daily

  return () => clearInterval(interval);
}, []);
```

### 3. Limit Image Cache

```typescript
import { Image } from 'expo-image';

// Limit cache size
Image.clearMemoryCache();
Image.clearDiskCache();
```

---

## Network Performance

### 1. Enable Compression

Already handled by Supabase and modern HTTP.

### 2. Implement Pagination

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['tasks'],
  queryFn: ({ pageParam = 0 }) => fetchTasks(pageParam, 20),
  getNextPageParam: (lastPage, pages) => {
    if (lastPage.length < 20) return undefined;
    return pages.length;
  },
});
```

### 3. Use Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (updatedTask) => {
    // Optimistically update UI
    await queryClient.cancelQueries(['tasks']);
    const previousTasks = queryClient.getQueryData(['tasks']);

    queryClient.setQueryData(['tasks'], (old) =>
      old.map(t => t.id === updatedTask.id ? updatedTask : t)
    );

    return { previousTasks };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previousTasks);
  },
});
```

---

## Monitoring Performance

### 1. React DevTools Profiler

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id, phase, actualDuration, baseDuration, startTime, commitTime
) {
  console.log(`${id} took ${actualDuration}ms to render`);
}

<Profiler id="TaskList" onRender={onRenderCallback}>
  <TaskList />
</Profiler>
```

### 2. Performance Monitoring

```typescript
import { analytics } from '@/services/analyticsService';

// Track performance metrics
const startTime = Date.now();
await expensiveOperation();
const duration = Date.now() - startTime;

analytics.trackPerformance('data_sync', duration);
```

### 3. Sentry Performance

```typescript
import { crashReporting } from '@/services/crashReporting';

const transaction = crashReporting.startTransaction('fetch_tasks', 'http');
await fetchTasks();
transaction?.finish();
```

---

## Production Checklist

### Before Building
- [ ] Run `npm run precheck`
- [ ] Remove all console.logs
- [ ] Optimize all images
- [ ] Enable Hermes
- [ ] Minification enabled
- [ ] Source maps generated
- [ ] Tree shaking configured

### Test Performance
- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks
- [ ] API calls < 500ms
- [ ] Bundle size < 50 MB
- [ ] Works smoothly on older devices

### Monitor in Production
- [ ] Track app size in analytics
- [ ] Monitor crash-free users %
- [ ] Track API response times
- [ ] Monitor memory usage
- [ ] Track user engagement metrics

---

## Common Performance Issues

### Issue: Slow Initial Load
**Solution:**
- Lazy load non-critical screens
- Reduce initial bundle size
- Optimize splash screen
- Preload critical data only

### Issue: Laggy Scrolling
**Solution:**
- Use FlatList instead of ScrollView for long lists
- Implement `getItemLayout` for known item sizes
- Use `removeClippedSubviews`
- Memoize renderItem function

### Issue: High Memory Usage
**Solution:**
- Clear unused images from cache
- Remove event listeners on unmount
- Limit list rendering with pagination
- Profile with React DevTools

### Issue: Slow API Responses
**Solution:**
- Implement caching with React Query
- Use pagination for large datasets
- Optimize database queries
- Add indexes to database tables

---

## Tools

- **Bundle Analyzer**: `npx react-native-bundle-visualizer`
- **Performance Profiler**: React DevTools
- **Network Inspector**: Flipper or React Native Debugger
- **Memory Profiler**: Xcode Instruments (iOS) / Android Profiler
- **Build Size**: EAS Build dashboard

---

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Optimization](https://docs.expo.dev/guides/analyzing-bundles/)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
