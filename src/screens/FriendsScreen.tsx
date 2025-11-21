import React, { useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Check, X, User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Card, CardContent, Button, Modal, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Friend {
  id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friend_email?: string;
}

export const FriendsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const { data: friends, refetch } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      return data as Friend[];
    },
    enabled: !!user,
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user?.id || '')
        .eq('status', 'pending');
      if (error) throw error;
      return data as Friend[];
    },
    enabled: !!user,
  });

  const sendRequest = useMutation({
    mutationFn: async (email: string) => {
      // This is a simplified version - in reality you'd look up the user by email
      const { error } = await supabase.from('friends').insert({
        user_id: user?.id || '',
        friend_id: email, // Would be friend's user_id
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Request Sent',
        text2: 'Friend request has been sent',
      });
      setShowAddModal(false);
      setFriendEmail('');
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send friend request',
      });
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderFriend = ({ item }: { item: Friend }) => (
    <Card style={styles.friendCard}>
      <CardContent style={styles.friendContent}>
        <View style={styles.avatar}>
          <User color="#6366f1" size={24} />
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.friend_email || `Friend ${item.id.slice(0, 8)}`}
          </Text>
          <Text style={styles.friendSince}>
            Friends since {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </CardContent>
    </Card>
  );

  const renderPendingRequest = ({ item }: { item: Friend }) => (
    <Card style={styles.requestCard}>
      <CardContent style={styles.requestContent}>
        <View style={styles.avatar}>
          <User color="#f59e0b" size={24} />
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>Friend Request</Text>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.acceptButton}>
            <Check color="#10b981" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton}>
            <X color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Users color="#71717a" size={48} />
      <Text style={styles.emptyTitle}>No Friends Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add friends to share your progress and compete in challenges
      </Text>
      <Button style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <UserPlus color="#ffffff" size={20} />
        <Text style={styles.addButtonText}>Add Friend</Text>
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        ListHeaderComponent={
          pendingRequests && pendingRequests.length > 0 ? (
            <View style={styles.pendingSection}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {pendingRequests.map((request) => renderPendingRequest({ item: request }))}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {friends && friends.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <UserPlus color="#ffffff" size={24} />
        </TouchableOpacity>
      )}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Friend"
      >
        <View style={styles.modalContent}>
          <Input
            label="Friend's Email"
            placeholder="Enter email address"
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.modalSpacer} />
          <Button
            onPress={() => sendRequest.mutate(friendEmail)}
            loading={sendRequest.isPending}
          >
            Send Request
          </Button>
        </View>
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
  pendingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 12,
  },
  friendCard: {
    marginBottom: 12,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 2,
  },
  friendSince: {
    fontSize: 12,
    color: '#71717a',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#71717a',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef444420',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalContent: {
    width: '100%',
  },
  modalSpacer: {
    height: 24,
  },
});
