import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, CheckSquare, Target, DollarSign, User } from 'lucide-react-native';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { TasksScreen } from '@/screens/TasksScreen';
import { HabitsScreen } from '@/screens/HabitsScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { TripDetailsScreen } from '@/screens/TripDetailsScreen';
import { TripsScreen } from '@/screens/TripsScreen';
import { MatrixScreen } from '@/screens/MatrixScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Habits: undefined;
  Expenses: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  TripDetails: { tripId: string };
  Trips: undefined;
  Matrix: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e4e4e7',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#09090b',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const MainTabNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Trips"
        component={TripsScreen}
        options={{ title: 'Trips' }}
      />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{ title: 'Trip Details' }}
      />
      <Stack.Screen
        name="Matrix"
        component={MatrixScreen}
        options={{ title: 'Priority Matrix' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};
