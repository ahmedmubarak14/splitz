import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  User,
  Settings,
  Bell,
  Moon,
  Globe,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export const ProfileScreen = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      t('auth.logout'),
      'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: signOut },
      ]
    );
  };

  const MenuItem = ({
    icon: Icon,
    title,
    onPress,
    showArrow = true,
    destructive = false,
  }: {
    icon: any;
    title: string;
    onPress?: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon color={destructive ? '#ef4444' : '#71717a'} size={20} />
        <Text
          style={[styles.menuItemText, destructive && styles.destructiveText]}
        >
          {title}
        </Text>
      </View>
      {showArrow && <ChevronRight color="#71717a" size={20} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            <View style={styles.avatar}>
              <User color="#6366f1" size={32} />
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.userId}>ID: {user?.id.slice(0, 8)}...</Text>
          </CardContent>
        </Card>

        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <MenuItem icon={User} title={t('profile.editProfile')} />
            <View style={styles.separator} />
            <MenuItem icon={Settings} title={t('profile.settings')} />
            <View style={styles.separator} />
            <MenuItem icon={Bell} title={t('profile.notifications')} />
          </CardContent>
        </Card>

        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <MenuItem icon={Moon} title={t('profile.theme')} />
            <View style={styles.separator} />
            <MenuItem icon={Globe} title={t('profile.language')} />
          </CardContent>
        </Card>

        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <MenuItem icon={Info} title={t('profile.about')} />
            <View style={styles.separator} />
            <View style={styles.versionItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemText}>{t('profile.version')}</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <MenuItem
              icon={LogOut}
              title={t('profile.logout')}
              onPress={handleSignOut}
              showArrow={false}
              destructive
            />
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
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#71717a',
  },
  menuCard: {
    marginBottom: 16,
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#09090b',
  },
  destructiveText: {
    color: '#ef4444',
  },
  separator: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginHorizontal: 16,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#71717a',
  },
});
