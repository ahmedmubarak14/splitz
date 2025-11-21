import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  DollarSign,
  Target,
  Trophy,
  Clock,
  User,
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityItem {
  id: string;
  type: 'habit' | 'expense' | 'task' | 'challenge' | 'focus';
  message: string;
  timestamp: Date;
  user: string;
}

export const ActivityFeedScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Mock activity data - in a real app, this would come from your backend
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'habit',
      message: 'Completed "Morning Meditation"',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: user?.email?.split('@')[0] || 'You',
    },
    {
      id: '2',
      type: 'task',
      message: 'Finished "Review project proposal"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: user?.email?.split('@')[0] || 'You',
    },
    {
      id: '3',
      type: 'expense',
      message: 'Added expense: Coffee - $4.50',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      user: user?.email?.split('@')[0] || 'You',
    },
    {
      id: '4',
      type: 'focus',
      message: 'Completed 4 focus sessions',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      user: user?.email?.split('@')[0] || 'You',
    },
    {
      id: '5',
      type: 'challenge',
      message: 'Joined "30-Day Fitness Challenge"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      user: user?.email?.split('@')[0] || 'You',
    },
  ];

  const { data: activities = mockActivities, refetch } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      // In a real implementation, fetch from your activity feed table
      return mockActivities;
    },
    enabled: !!user,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'habit':
        return <Target color="#10b981" size={20} />;
      case 'task':
        return <CheckCircle color="#6366f1" size={20} />;
      case 'expense':
        return <DollarSign color="#f59e0b" size={20} />;
      case 'challenge':
        return <Trophy color="#8b5cf6" size={20} />;
      case 'focus':
        return <Clock color="#3b82f6" size={20} />;
      default:
        return <CheckCircle color="#71717a" size={20} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'habit':
        return '#10b981';
      case 'task':
        return '#6366f1';
      case 'expense':
        return '#f59e0b';
      case 'challenge':
        return '#8b5cf6';
      case 'focus':
        return '#3b82f6';
      default:
        return '#71717a';
    }
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <Card style={styles.activityCard}>
      <CardContent style={styles.activityContent}>
        <View
          style={[
            styles.activityIcon,
            { backgroundColor: getActivityColor(item.type) + '20' },
          ]}
        >
          {getActivityIcon(item.type)}
        </View>
        <View style={styles.activityInfo}>
          <View style={styles.activityHeader}>
            <View style={styles.userInfo}>
              <User color="#71717a" size={14} />
              <Text style={styles.userName}>{item.user}</Text>
            </View>
            <Text style={styles.activityTime}>
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </Text>
          </View>
          <Text style={styles.activityMessage}>{item.message}</Text>
        </View>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Activity Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your activity will appear here as you use the app
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityContent: {
    flexDirection: 'row',
    padding: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
  activityTime: {
    fontSize: 12,
    color: '#71717a',
  },
  activityMessage: {
    fontSize: 14,
    color: '#71717a',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
});
