import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  isOnline,
  subscribeToNetworkStatus,
  getOfflineQueue,
  processOfflineQueue,
  getLastSyncTime,
  setLastSyncTime,
  clearExpiredCache,
  getCacheSize,
} from '@/utils/offlineStorage';

/**
 * React Hook for Offline Support
 * Provides network status and offline queue management
 */
export function useOffline() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Load initial state
  useEffect(() => {
    loadOfflineState();
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus((connected) => {
      setIsConnected(connected);

      // Auto-sync when coming back online
      if (connected && !isSyncing) {
        handleAutoSync();
      }
    });

    return unsubscribe;
  }, [isSyncing]);

  // Update queue size when connection changes
  useEffect(() => {
    updateQueueSize();
  }, [isConnected]);

  const loadOfflineState = async () => {
    try {
      const online = await isOnline();
      setIsConnected(online);

      const syncTime = await getLastSyncTime();
      setLastSync(syncTime ? new Date(syncTime) : null);

      await updateQueueSize();
    } catch (error) {
      console.error('Error loading offline state:', error);
    }
  };

  const updateQueueSize = async () => {
    try {
      const queue = await getOfflineQueue();
      setQueueSize(queue.length);
    } catch (error) {
      console.error('Error updating queue size:', error);
    }
  };

  const handleAutoSync = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      await syncOfflineQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Manually trigger sync of offline queue
   */
  const syncOfflineQueue = async (): Promise<{ success: number; failed: number }> => {
    try {
      setIsSyncing(true);

      const result = await processOfflineQueue(async (action) => {
        try {
          // Here you would call your actual API based on action type
          // This is a placeholder implementation
          console.log('Processing offline action:', action);

          // TODO: Implement actual sync logic
          // Example:
          // if (action.type === 'create' && action.entity === 'task') {
          //   await createTask(action.data);
          // }

          return true; // Return true if successfully synced
        } catch (error) {
          console.error('Failed to process action:', error);
          return false;
        }
      });

      // Update last sync time
      await setLastSyncTime();
      setLastSync(new Date());

      // Update queue size
      await updateQueueSize();

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries();

      return result;
    } catch (error) {
      console.error('Error syncing offline queue:', error);
      return { success: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Refresh data (refetch all queries)
   */
  const refresh = async (): Promise<void> => {
    if (isConnected) {
      await queryClient.invalidateQueries();
    }
  };

  /**
   * Clear expired cache entries
   */
  const cleanCache = async (): Promise<number> => {
    return await clearExpiredCache();
  };

  /**
   * Get total cache size in bytes
   */
  const getCacheSizeBytes = async (): Promise<number> => {
    return await getCacheSize();
  };

  /**
   * Get formatted cache size
   */
  const getFormattedCacheSize = async (): Promise<string> => {
    const bytes = await getCacheSizeBytes();

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Check if app can perform network operations
   */
  const canSync = (): boolean => {
    return isConnected && !isSyncing;
  };

  return {
    // Network status
    isConnected,
    isOffline: !isConnected,

    // Sync state
    isSyncing,
    lastSync,
    queueSize,

    // Actions
    syncOfflineQueue,
    refresh,
    cleanCache,
    getCacheSizeBytes,
    getFormattedCacheSize,
    canSync,

    // Helpers
    updateQueueSize,
  };
}
