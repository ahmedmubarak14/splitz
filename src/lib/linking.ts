import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [prefix, 'splitz://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Dashboard: 'dashboard',
              Tasks: 'tasks',
              Habits: 'habits',
              Expenses: 'expenses',
              Profile: 'profile',
            },
          },
          Calendar: 'calendar',
          Focus: 'focus',
          Challenges: 'challenges',
          Friends: 'friends',
          ActivityFeed: 'activity',
          Subscriptions: 'subscriptions',
          Trips: 'trips',
          TripDetails: {
            path: 'trip/:tripId',
            parse: {
              tripId: (tripId: string) => tripId,
            },
          },
        },
      },
    },
  },
};

// Helper to generate deep links
export const generateDeepLink = (path: string) => {
  return Linking.createURL(path);
};

// Open external URL
export const openURL = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    console.log(`Don't know how to open this URL: ${url}`);
  }
};
