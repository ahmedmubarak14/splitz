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
import { Plus, DollarSign } from 'lucide-react-native';
import { format } from 'date-fns';

import { Card, CardContent, Button, Modal } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreateExpenseForm } from '@/components/forms/CreateExpenseForm';

interface Expense {
  id: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

export const ExpensesScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { data: expenses, refetch } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const totalExpenses =
    expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getCategoryColor = (category: string | null) => {
    const colors: { [key: string]: string } = {
      food: '#f59e0b',
      transport: '#3b82f6',
      entertainment: '#8b5cf6',
      shopping: '#ec4899',
      bills: '#ef4444',
      health: '#10b981',
      other: '#71717a',
    };
    return colors[category || 'other'] || colors.other;
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card style={styles.expenseCard}>
      <CardContent style={styles.expenseContent}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: getCategoryColor(item.category) + '20' },
          ]}
        >
          <DollarSign color={getCategoryColor(item.category)} size={20} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>
            {item.description || item.category || 'Expense'}
          </Text>
          <Text style={styles.expenseDate}>
            {format(new Date(item.date), 'MMM d, yyyy')}
          </Text>
          {item.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(item.category) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: getCategoryColor(item.category) },
                ]}
              >
                {t(`expenses.categories.${item.category}`) || item.category}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </CardContent>
    </Card>
  );

  const ListHeader = () => (
    <Card style={styles.summaryCard}>
      <CardContent style={styles.summaryContent}>
        <Text style={styles.summaryLabel}>{t('expenses.total')}</Text>
        <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{t('expenses.noExpenses')}</Text>
      <Text style={styles.emptySubtitle}>{t('expenses.addFirst')}</Text>
      <Button style={styles.addButton} onPress={() => setShowCreateModal(true)}>
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>{t('expenses.addExpense')}</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={expenses && expenses.length > 0 ? ListHeader : null}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {expenses && expenses.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      )}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Expense"
      >
        <CreateExpenseForm onSuccess={() => setShowCreateModal(false)} />
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#09090b',
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
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
