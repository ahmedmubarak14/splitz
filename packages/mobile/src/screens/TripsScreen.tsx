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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, MapPin, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';

import { Card, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainStackParamList } from '@/navigation/MainTabNavigator';

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

export const TripsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: trips, refetch } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
    >
      <Card style={styles.tripCard}>
        <CardContent style={styles.tripContent}>
          <Text style={styles.tripName}>{item.name}</Text>
          {item.destination && (
            <View style={styles.tripInfo}>
              <MapPin color="#71717a" size={14} />
              <Text style={styles.tripInfoText}>{item.destination}</Text>
            </View>
          )}
          {item.start_date && (
            <View style={styles.tripInfo}>
              <Calendar color="#71717a" size={14} />
              <Text style={styles.tripInfoText}>
                {format(new Date(item.start_date), 'MMM d, yyyy')}
                {item.end_date &&
                  ` - ${format(new Date(item.end_date), 'MMM d, yyyy')}`}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{t('trips.noTrips')}</Text>
      <Text style={styles.emptySubtitle}>{t('trips.createFirst')}</Text>
      <Button style={styles.addButton}>
        <Plus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>{t('trips.addTrip')}</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {trips && trips.length > 0 && (
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
  tripCard: {
    marginBottom: 12,
  },
  tripContent: {
    padding: 16,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tripInfoText: {
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
