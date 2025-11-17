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
import { Plus, CreditCard, Calendar, AlertTriangle } from 'lucide-react-native';
import { format, differenceInDays, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  next_billing_date: string;
  category: string | null;
}

export const SubscriptionsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: subscriptions, refetch } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('next_billing_date', { ascending: true });
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!user,
  });

  const totalMonthly =
    subscriptions?.reduce((sum, sub) => {
      if (sub.billing_cycle === 'monthly') return sum + sub.amount;
      if (sub.billing_cycle === 'yearly') return sum + sub.amount / 12;
      return sum;
    }, 0) || 0;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getDaysUntilBilling = (date: string) => {
    return differenceInDays(parseISO(date), new Date());
  };

  const renderSubscription = ({ item }: { item: Subscription }) => {
    const daysUntil = getDaysUntilBilling(item.next_billing_date);
    const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

    return (
      <Card style={styles.subscriptionCard}>
        <CardContent style={styles.subscriptionContent}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionIcon}>
              <CreditCard color="#6366f1" size={20} />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionName}>{item.name}</Text>
              <Text style={styles.subscriptionCycle}>{item.billing_cycle}</Text>
            </View>
            <Text style={styles.subscriptionAmount}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.nextBilling}>
            <Calendar color="#71717a" size={14} />
            <Text style={styles.nextBillingText}>
              Next billing: {format(parseISO(item.next_billing_date), 'MMM d, yyyy')}
            </Text>
            {isUpcoming && (
              <View style={styles.upcomingBadge}>
                <AlertTriangle color="#f59e0b" size={12} />
                <Text style={styles.upcomingText}>
                  {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    );
  };

  const ListHeader = () => (
    <Card style={styles.summaryCard}>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent style={styles.summaryContent}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Monthly</Text>
          <Text style={styles.summaryAmount}>${totalMonthly.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Yearly Estimate</Text>
          <Text style={styles.summaryAmount}>
            ${(totalMonthly * 12).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Active Subscriptions</Text>
          <Text style={styles.summaryCount}>{subscriptions?.length || 0}</Text>
        </View>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <CreditCard color="#71717a" size={48} />
      <Text style={styles.emptyTitle}>No Subscriptions</Text>
      <Text style={styles.emptySubtitle}>
        Track your recurring payments and subscriptions
      </Text>
      <Button style={styles.addButton}>
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>Add Subscription</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={subscriptions}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          subscriptions && subscriptions.length > 0 ? ListHeader : null
        }
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {subscriptions && subscriptions.length > 0 && (
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    padding: 16,
    paddingTop: 0,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#71717a',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
  },
  subscriptionCard: {
    marginBottom: 12,
  },
  subscriptionContent: {
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
  },
  subscriptionCycle: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'capitalize',
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  nextBilling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextBillingText: {
    fontSize: 12,
    color: '#71717a',
    flex: 1,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  upcomingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
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
