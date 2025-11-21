import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface DataStateHandlerProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error?: Error | null;
  emptyMessage?: string;
  emptyIcon?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Data State Handler Component
 * Handles loading, error, and empty states for data-driven screens
 * Automatically displays appropriate UI based on state
 */
export const DataStateHandler: React.FC<DataStateHandlerProps> = ({
  isLoading,
  isError,
  isEmpty,
  error,
  emptyMessage = 'No data available',
  emptyIcon = '📭',
  loadingMessage = 'Loading...',
  onRetry,
  children,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'An unexpected error occurred'}
        </Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>{emptyIcon}</Text>
        <Text style={styles.emptyTitle}>Nothing Here Yet</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  // Success state - render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
