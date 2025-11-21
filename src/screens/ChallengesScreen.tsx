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
import { Plus, Trophy, Users, Target } from 'lucide-react-native';

import { Card, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  creator_id: string;
}

export const ChallengesScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: challenges, refetch } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const progress = getProgress(item.current_value, item.target_value);
    const isCompleted = progress >= 100;

    return (
      <Card style={styles.challengeCard}>
        <CardContent style={styles.challengeContent}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIcon}>
              <Trophy color={isCompleted ? '#f59e0b' : '#6366f1'} size={24} />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.challengeDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: isCompleted ? '#10b981' : '#6366f1',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.current_value}/{item.target_value}
            </Text>
          </View>

          <View style={styles.challengeFooter}>
            <View style={styles.participantsInfo}>
              <Users color="#71717a" size={16} />
              <Text style={styles.participantsText}>3 participants</Text>
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Target color="#71717a" size={48} />
      <Text style={styles.emptyTitle}>No Challenges Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create a challenge to compete with friends
      </Text>
      <Button style={styles.addButton}>
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>Create Challenge</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {challenges && challenges.length > 0 && (
        <TouchableOpacity style={styles.fab}>
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      )}
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
  challengeCard: {
    marginBottom: 12,
  },
  challengeContent: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#71717a',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e4e4e7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    color: '#71717a',
  },
  completedBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 24,
    textAlign: 'center',
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
