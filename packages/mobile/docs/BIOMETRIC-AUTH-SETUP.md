# Biometric Authentication Setup Guide

This app now includes Face ID, Touch ID, and fingerprint authentication support!

## Installation

### 1. Install Required Package

```bash
cd packages/mobile
npx expo install expo-local-authentication
```

### 2. Configure App Permissions

The permissions are already configured in `app.json`, but verify:

**iOS (app.json)**:
```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "Enable Face ID for quick and secure access to your account."
    }
  }
}
```

**Android**: No additional permissions needed for fingerprint/biometric auth.

## Usage in Components

### Example 1: Add Biometric Login to Login Screen

```tsx
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

function LoginScreen() {
  const { isAvailable, isEnabled, biometricType, authenticate } = useBiometricAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show biometric login button after successful password login
  const handleBiometricLogin = async () => {
    const result = await authenticate('Login with biometrics');

    if (result.success) {
      // Retrieve stored credentials and login
      // This is just an example - implement your own secure storage
      await loginWithStoredCredentials();
    } else {
      Alert.alert('Authentication Failed', result.error);
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

      <Button title="Login with Password" onPress={handlePasswordLogin} />

      {isAvailable && isEnabled && (
        <Button
          title={`Login with ${biometricType}`}
          onPress={handleBiometricLogin}
        />
      )}
    </View>
  );
}
```

### Example 2: Settings Toggle

```tsx
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

function SettingsScreen() {
  const {
    isAvailable,
    isEnabled,
    biometricType,
    isLoading,
    toggle
  } = useBiometricAuth();

  const handleToggleBiometric = async () => {
    const success = await toggle();

    if (success || !isEnabled) {
      Alert.alert(
        'Success',
        `Biometric authentication ${isEnabled ? 'disabled' : 'enabled'}`
      );
    }
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!isAvailable) {
    return (
      <Text>
        Biometric authentication is not available on this device.
        Please set up Face ID or fingerprint in your device settings.
      </Text>
    );
  }

  return (
    <View>
      <Text>Enable {biometricType}</Text>
      <Switch value={isEnabled} onValueChange={handleToggleBiometric} />
    </View>
  );
}
```

### Example 3: Protect Sensitive Actions

```tsx
import { authenticateWithBiometrics } from '@/utils/biometricAuth';

async function deleteAccount() {
  // Require biometric auth before dangerous action
  const result = await authenticateWithBiometrics(
    'Authenticate to delete your account'
  );

  if (result.success) {
    // Proceed with deletion
    await performAccountDeletion();
  } else {
    Alert.alert('Authentication Required', result.error);
  }
}
```

## API Reference

### Hook: `useBiometricAuth()`

**State:**
- `isSupported: boolean` - Device has biometric hardware
- `isEnrolled: boolean` - User has enrolled biometrics (Face ID/fingerprint set up)
- `isEnabled: boolean` - Biometric auth is enabled for this app
- `biometricType: string` - User-friendly name (e.g., "Face ID", "Touch ID")
- `isLoading: boolean` - Loading biometric info
- `isAvailable: boolean` - Convenience property (`isSupported && isEnrolled`)

**Methods:**
- `authenticate(promptMessage?: string): Promise<BiometricAuthResult>` - Authenticate user
- `enable(): Promise<boolean>` - Enable biometric auth for app
- `disable(): Promise<void>` - Disable biometric auth
- `toggle(): Promise<boolean>` - Toggle biometric auth on/off
- `refresh(): Promise<void>` - Refresh biometric info

### Utility Functions

Available in `@/utils/biometricAuth`:

- `isBiometricSupported(): Promise<boolean>`
- `isBiometricEnrolled(): Promise<boolean>`
- `getAvailableBiometrics(): Promise<AuthenticationType[]>`
- `authenticateWithBiometrics(promptMessage?: string): Promise<BiometricAuthResult>`
- `isBiometricAuthEnabled(): Promise<boolean>`
- `enableBiometricAuth(): Promise<void>`
- `disableBiometricAuth(): Promise<void>`

## Security Best Practices

### ✅ DO:
- Use biometric auth as a **convenience feature** alongside passwords
- Store only session tokens or encrypted keys in SecureStore
- Re-authenticate for sensitive operations (account deletion, payment)
- Provide fallback to password if biometric auth fails
- Clear biometric auth on logout

### ❌ DON'T:
- Don't store plain-text passwords for biometric auth
- Don't rely solely on biometrics (always have password fallback)
- Don't use biometrics for permanent account access
- Don't assume all devices support biometrics

## Implementation Checklist

- [ ] Install `expo-local-authentication` package
- [ ] Add Face ID usage description to `app.json`
- [ ] Import biometric auth utilities or hook
- [ ] Add biometric toggle to Settings screen
- [ ] Add biometric login option to Login screen
- [ ] Test on physical device (doesn't work in simulator fully)
- [ ] Handle edge cases (biometrics not enrolled, disabled, etc.)
- [ ] Clear biometric auth on logout
- [ ] Add biometric prompt for sensitive operations

## Testing

### iOS Simulator:
1. Simulator → Features → Face ID → Enrolled
2. When prompted, use: Simulator → Features → Face ID → Matching Face

### Android Emulator:
1. Settings → Security → Fingerprint
2. When prompted, click the fingerprint icon in emulator controls

### Physical Device:
Test with your actual Face ID/Touch ID for best results!

## Platform Support

| Platform | Biometric Types | Supported |
|----------|----------------|-----------|
| iOS 11+  | Face ID, Touch ID | ✅ |
| Android 6+ | Fingerprint, Face | ✅ |
| Android 10+ | BiometricPrompt API | ✅ |
| Web | None | ❌ |

## Troubleshooting

**"Biometric authentication is not supported"**
- Device doesn't have biometric hardware
- Running on unsupported iOS/Android version

**"No biometric credentials enrolled"**
- User hasn't set up Face ID/Touch ID/Fingerprint
- Guide them to device Settings

**Authentication always fails:**
- Check if biometric data is enrolled correctly
- Try re-enrolling in device settings
- Check app permissions

## Next Steps

After implementing biometric auth:
1. Add analytics to track adoption rate
2. Prompt users to enable it after first successful login
3. Add option to re-enable if they previously declined
4. Consider adding biometric auth for app unlock (not just login)
