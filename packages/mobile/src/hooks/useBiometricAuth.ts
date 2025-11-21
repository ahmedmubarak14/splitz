import { useState, useEffect } from 'react';
import {
  authenticateWithBiometrics,
  isBiometricSupported,
  isBiometricEnrolled,
  isBiometricAuthEnabled,
  enableBiometricAuth,
  disableBiometricAuth,
  getBiometricInfo,
  BiometricAuthResult,
} from '@/utils/biometricAuth';

/**
 * React Hook for Biometric Authentication
 * Provides easy access to biometric auth functionality in components
 */
export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load biometric info on mount
  useEffect(() => {
    loadBiometricInfo();
  }, []);

  const loadBiometricInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getBiometricInfo();
      setIsSupported(info.supported);
      setIsEnrolled(info.enrolled);
      setIsEnabled(info.enabled);
      setBiometricType(info.types);
    } catch (error) {
      console.error('Error loading biometric info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Authenticate with biometrics
   */
  const authenticate = async (
    promptMessage?: string
  ): Promise<BiometricAuthResult> => {
    return await authenticateWithBiometrics(promptMessage);
  };

  /**
   * Enable biometric authentication
   */
  const enable = async (): Promise<boolean> => {
    try {
      // First authenticate
      const result = await authenticateWithBiometrics(
        'Authenticate to enable biometric login'
      );

      if (result.success) {
        await enableBiometricAuth();
        setIsEnabled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  };

  /**
   * Disable biometric authentication
   */
  const disable = async (): Promise<void> => {
    try {
      await disableBiometricAuth();
      setIsEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
      throw error;
    }
  };

  /**
   * Toggle biometric authentication on/off
   */
  const toggle = async (): Promise<boolean> => {
    if (isEnabled) {
      await disable();
      return false;
    } else {
      return await enable();
    }
  };

  /**
   * Refresh biometric info (useful after settings change)
   */
  const refresh = async (): Promise<void> => {
    await loadBiometricInfo();
  };

  return {
    // State
    isSupported,
    isEnrolled,
    isEnabled,
    biometricType,
    isLoading,
    isAvailable: isSupported && isEnrolled,

    // Actions
    authenticate,
    enable,
    disable,
    toggle,
    refresh,
  };
}
