import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

/**
 * React Query Persistence Configuration
 * Enables offline-first data persistence using AsyncStorage
 */

const QUERY_CACHE_KEY = '@react_query_cache';

/**
 * Create AsyncStorage persister for React Query
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000, // Throttle saves to once per second
});

/**
 * Create QueryClient with offline-first configuration
 */
export function createOfflineQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 24 hours
        gcTime: 1000 * 60 * 60 * 24,

        // Keep data fresh for 5 minutes
        staleTime: 1000 * 60 * 5,

        // Retry failed queries 3 times
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Don't refetch on window focus in mobile apps
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Network mode for offline support
        networkMode: 'offlineFirst', // Try cache first, then network
      },
      mutations: {
        // Retry failed mutations
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode for mutations
        networkMode: 'offlineFirst',
      },
    },
  });
}

/**
 * Clear React Query cache
 */
export async function clearQueryCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUERY_CACHE_KEY);
    console.log('Query cache cleared');
  } catch (error) {
    console.error('Error clearing query cache:', error);
  }
}

/**
 * Get query cache size
 */
export async function getQueryCacheSize(): Promise<number> {
  try {
    const cache = await AsyncStorage.getItem(QUERY_CACHE_KEY);
    if (!cache) return 0;

    return new Blob([cache]).size;
  } catch (error) {
    console.error('Error getting query cache size:', error);
    return 0;
  }
}

/**
 * Configuration for PersistQueryClientProvider
 */
export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: '', // Change this to invalidate all cached data
  dehydrateOptions: {
    shouldDehydrateQuery: (query: any) => {
      // Only persist successful queries
      return query.state.status === 'success';
    },
  },
};
