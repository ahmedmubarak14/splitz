import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MapPin, Calendar, Users, DollarSign } from 'lucide-react-native';
import { format } from 'date-fns';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MainStackParamList } from '@/navigation/MainTabNavigator';

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export const TripDetailsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const route = useRoute<RouteProp<MainStackParamList, 'TripDetails'>>();
  const { tripId } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: trip, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (error) throw error;
      return data as Trip;
    },
    enabled: !!tripId,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.headerCard}>
          <CardContent style={styles.headerContent}>
            <Text style={styles.tripName}>{trip.name}</Text>
            {trip.destination && (
              <View style={styles.infoRow}>
                <MapPin color="#6366f1" size={18} />
                <Text style={styles.infoText}>{trip.destination}</Text>
              </View>
            )}
            {trip.start_date && (
              <View style={styles.infoRow}>
                <Calendar color="#6366f1" size={18} />
                <Text style={styles.infoText}>
                  {format(new Date(trip.start_date), 'MMM d, yyyy')}
                  {trip.end_date &&
                    ` - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
                </Text>
              </View>
            )}
            {trip.description && (
              <Text style={styles.description}>{trip.description}</Text>
            )}
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Users color="#09090b" size={20} />
                <Text style={styles.sectionTitle}>
                  {t('trips.participants')}
                </Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.placeholderText}>
              No participants added yet
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <DollarSign color="#09090b" size={20} />
                <Text style={styles.sectionTitle}>{t('trips.expenses')}</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.placeholderText}>No expenses recorded yet</Text>
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
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#71717a',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },
  tripName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09090b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#09090b',
  },
  description: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  placeholderText: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
