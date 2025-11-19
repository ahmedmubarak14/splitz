import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const isNativeApp = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

export const isPlatform = (platform: 'web' | 'capacitor' | 'ios' | 'android') => {
  if (platform === 'capacitor') return isNativeApp;
  if (platform === 'web') return isWeb;
  if (platform === 'ios') return isIOS;
  if (platform === 'android') return isAndroid;
  return false;
};

export const getPlatformClass = () => {
  if (isIOS) return 'platform-ios';
  if (isAndroid) return 'platform-android';
  return 'platform-web';
};

export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};
