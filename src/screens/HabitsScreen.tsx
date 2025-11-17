import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Flame } from 'lucide-react-native';

import { Card, CardContent, Button, Modal } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreateHabitForm } from '@/components/forms/CreateHabitForm';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  current_streak: number;
  longest_streak: number;
}

export const HabitsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: habits, refetch } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderHabit = ({ item }: { item: Habit }) => (
    <Card style={styles.habitCard}>
      <CardContent style={styles.habitContent}>
        <View style={styles.habitHeader}>
          <Text style={styles.habitName}>{item.name}</Text>
          <View style={styles.streakContainer}>
            <Flame color="#f59e0b" size={16} />
            <Text style={styles.streakText}>{item.current_streak}</Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.habitDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.habitFooter}>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>
              {t(`habits.${item.frequency}`)}
            </Text>
          </View>
          <Text style={styles.longestStreak}>
            {t('habits.longestStreak')}: {item.longest_streak} {t('habits.days')}
          </Text>
        </View>
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>
            {t('habits.completedToday')}
          </Text>
        </TouchableOpacity>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{t('habits.noHabits')}</Text>
      <Text style={styles.emptySubtitle}>{t('habits.createFirst')}</Text>
      <Button style={styles.addButton} onPress={() => setShowCreateModal(true)}>
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>{t('habits.addHabit')}</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {habits && habits.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      )}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Habit"
      >
        <CreateHabitForm onSuccess={() => setShowCreateModal(false)} />
      </Modal>
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
  habitCard: {
    marginBottom: 12,
  },
  habitContent: {
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  habitDescription: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 12,
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  frequencyBadge: {
    backgroundColor: '#6366f120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  longestStreak: {
    fontSize: 12,
    color: '#71717a',
  },
  completeButton: {
    backgroundColor: '#10b98120',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
