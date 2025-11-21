import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Offline Storage Utility
 * Handles data persistence and offline queue management
 */

const OFFLINE_QUEUE_KEY = '@offline_queue';
const CACHED_DATA_PREFIX = '@cached_';
const LAST_SYNC_KEY = '@last_sync';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'habit' | 'expense' | 'trip';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(
  callback: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });

  return unsubscribe;
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHED_DATA_PREFIX}${key}`);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    return parsed.data as T;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Set cached data with expiry
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 3600000 // 1 hour default
): Promise<void> {
  try {
    const cached = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    await AsyncStorage.setItem(
      `${CACHED_DATA_PREFIX}${key}`,
      JSON.stringify(cached)
    );
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
}

/**
 * Check if cached data is still valid
 */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHED_DATA_PREFIX}${key}`);
    if (!cached) return false;

    const parsed = JSON.parse(cached);
    return Date.now() < parsed.expiresAt;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Clear cached data
 */
export async function clearCachedData(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(`${CACHED_DATA_PREFIX}${key}`);
    } else {
      // Clear all cached data
      const keys = await AsyncStorage.getAllKeys();
      const cachedKeys = keys.filter((k) => k.startsWith(CACHED_DATA_PREFIX));
      await AsyncStorage.multiRemove(cachedKeys);
    }
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
}

/**
 * Add action to offline queue
 */
export async function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();

    const newAction: OfflineAction = {
      ...action,
      id: `${action.entity}_${action.type}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    console.log('Added to offline queue:', newAction);
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

/**
 * Get offline queue
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Remove action from offline queue
 */
export async function removeFromOfflineQueue(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((action) => action.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

/**
 * Update action retry count
 */
export async function incrementRetryCount(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const updated = queue.map((action) =>
      action.id === actionId
        ? { ...action, retryCount: action.retryCount + 1 }
        : action
    );
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error incrementing retry count:', error);
  }
}

/**
 * Clear offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

/**
 * Process offline queue when back online
 */
export async function processOfflineQueue(
  processor: (action: OfflineAction) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const queue = await getOfflineQueue();
  let success = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      // Skip actions that have failed too many times
      if (action.retryCount >= 3) {
        console.log('Action exceeded retry limit:', action);
        await removeFromOfflineQueue(action.id);
        failed++;
        continue;
      }

      // Try to process the action
      const processed = await processor(action);

      if (processed) {
        await removeFromOfflineQueue(action.id);
        success++;
      } else {
        await incrementRetryCount(action.id);
        failed++;
      }
    } catch (error) {
      console.error('Error processing offline action:', error);
      await incrementRetryCount(action.id);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncTime(timestamp: number = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
}

/**
 * Cache management: Get cache size
 */
export async function getCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cachedKeys = keys.filter((k) => k.startsWith(CACHED_DATA_PREFIX));

    let totalSize = 0;
    for (const key of cachedKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
}

/**
 * Cache management: Clear expired cache
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cachedKeys = keys.filter((k) => k.startsWith(CACHED_DATA_PREFIX));

    let cleared = 0;
    for (const key of cachedKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        if (Date.now() >= parsed.expiresAt) {
          await AsyncStorage.removeItem(key);
          cleared++;
        }
      }
    }

    return cleared;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
}

/**
 * Optimistic update helper
 * Updates local cache immediately, then syncs with server
 */
export async function optimisticUpdate<T>(
  cacheKey: string,
  updateFn: (current: T | null) => T,
  syncFn: () => Promise<T>
): Promise<T> {
  try {
    // Get current cached data
    const current = await getCachedData<T>(cacheKey);

    // Apply optimistic update
    const updated = updateFn(current);

    // Update cache immediately
    await setCachedData(cacheKey, updated);

    // Try to sync with server
    const online = await isOnline();
    if (online) {
      try {
        const synced = await syncFn();
        await setCachedData(cacheKey, synced);
        return synced;
      } catch (error) {
        console.error('Sync failed, using optimistic update:', error);
        // Keep optimistic update if sync fails
        return updated;
      }
    }

    return updated;
  } catch (error) {
    console.error('Optimistic update failed:', error);
    throw error;
  }
}
