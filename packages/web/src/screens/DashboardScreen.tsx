import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  CheckSquare,
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  Map,
} from 'lucide-react-native';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const DashboardScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch tasks count
  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ['dashboard-tasks', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id || '')
        .eq('is_complete', false);
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch habits count
  const { data: habitsData, refetch: refetchHabits } = useQuery({
    queryKey: ['dashboard-habits', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id || '');
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch recent expenses
  const { data: expensesData, refetch: refetchExpenses } = useQuery({
    queryKey: ['dashboard-expenses', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user?.id || '')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      return data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    },
    enabled: !!user,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTasks(), refetchHabits(), refetchExpenses()]);
    setRefreshing(false);
  }, [refetchTasks, refetchHabits, refetchExpenses]);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
  }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <Card style={styles.statCard}>
      <CardContent style={styles.statContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon color={color} size={24} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </CardContent>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {t('dashboard.welcome')}, {user?.email?.split('@')[0] || 'User'}!
          </Text>
          <Text style={styles.subtitle}>{t('dashboard.overview')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={CheckSquare}
            title={t('dashboard.todaysTasks')}
            value={tasksData || 0}
            color="#6366f1"
          />
          <StatCard
            icon={Target}
            title={t('dashboard.activeHabits')}
            value={habitsData || 0}
            color="#10b981"
          />
          <StatCard
            icon={DollarSign}
            title={t('dashboard.recentExpenses')}
            value={`$${expensesData?.toFixed(2) || '0.00'}`}
            color="#f59e0b"
          />
          <StatCard
            icon={TrendingUp}
            title={t('dashboard.stats')}
            value="View"
            color="#8b5cf6"
          />
        </View>

        <Card style={styles.quickActionsCard}>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent style={styles.quickActionsContent}>
            <TouchableOpacity style={styles.quickAction}>
              <Calendar color="#6366f1" size={20} />
              <Text style={styles.quickActionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Map color="#6366f1" size={20} />
              <Text style={styles.quickActionText}>Trips</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09090b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsContent: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
});
