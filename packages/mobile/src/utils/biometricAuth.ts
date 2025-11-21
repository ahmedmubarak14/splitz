import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * Biometric Authentication Utility
 * Provides Face ID, Touch ID, and fingerprint authentication
 */

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
}

/**
 * Check if biometric credentials are enrolled (e.g., fingerprints saved)
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
}

/**
 * Get available biometric types on the device
 * @returns Array of biometric types (e.g., FINGERPRINT, FACE_ID, IRIS)
 */
export async function getAvailableBiometrics(): Promise<LocalAuthentication.AuthenticationType[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return [];
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID / Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris Recognition';
  }
  return 'Biometric Authentication';
}

/**
 * Authenticate user with biometrics
 * @param promptMessage Custom message to show during authentication
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricAuthResult> {
  try {
    // Check if biometrics are supported
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return {
        success: false,
        error: 'Biometric authentication is not supported on this device',
      };
    }

    // Check if biometrics are enrolled
    const isEnrolled = await isBiometricEnrolled();
    if (!isEnrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled. Please set up Face ID or fingerprint in your device settings.',
      };
    }

    // Get biometric types
    const types = await getAvailableBiometrics();
    const biometricType = getBiometricTypeName(types);

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false, // Allow fallback to device passcode
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return {
        success: true,
        biometricType,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Check if biometric authentication is enabled for the app
 */
export async function isBiometricAuthEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync('biometric_auth_enabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric auth status:', error);
    return false;
  }
}

/**
 * Enable biometric authentication for the app
 */
export async function enableBiometricAuth(): Promise<void> {
  try {
    await SecureStore.setItemAsync('biometric_auth_enabled', 'true');
  } catch (error) {
    console.error('Error enabling biometric auth:', error);
    throw error;
  }
}

/**
 * Disable biometric authentication for the app
 */
export async function disableBiometricAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('biometric_auth_enabled');
  } catch (error) {
    console.error('Error disabling biometric auth:', error);
    throw error;
  }
}

/**
 * Prompt user to enable biometric authentication
 * Returns true if user enabled it, false otherwise
 */
export async function promptEnableBiometricAuth(): Promise<boolean> {
  try {
    // Check if biometrics are available
    const isSupported = await isBiometricSupported();
    const isEnrolled = await isBiometricEnrolled();

    if (!isSupported || !isEnrolled) {
      return false;
    }

    // Authenticate to enable
    const result = await authenticateWithBiometrics('Authenticate to enable biometric login');

    if (result.success) {
      await enableBiometricAuth();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error prompting biometric auth:', error);
    return false;
  }
}

/**
 * Get biometric capability information for display in settings
 */
export async function getBiometricInfo(): Promise<{
  supported: boolean;
  enrolled: boolean;
  types: string;
  enabled: boolean;
}> {
  const supported = await isBiometricSupported();
  const enrolled = await isBiometricEnrolled();
  const typesList = await getAvailableBiometrics();
  const types = getBiometricTypeName(typesList);
  const enabled = await isBiometricAuthEnabled();

  return {
    supported,
    enrolled,
    types,
    enabled,
  };
}
