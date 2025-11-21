import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'destructive':
        return styles.destructive;
      case 'outline':
        return styles.outline;
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      case 'link':
        return styles.link;
      default:
        return styles.default;
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case 'destructive':
        return styles.destructiveText;
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      case 'link':
        return styles.linkText;
      default:
        return styles.defaultText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return styles.sm;
      case 'lg':
        return styles.lg;
      case 'icon':
        return styles.icon;
      default:
        return styles.defaultSize;
    }
  };

  const getSizeTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'lg':
        return styles.lgText;
      default:
        return styles.defaultSizeText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#6366f1'}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            getVariantTextStyle(),
            getSizeTextStyle(),
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  // Variants
  default: {
    backgroundColor: '#6366f1',
  },
  defaultText: {
    color: '#ffffff',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  destructiveText: {
    color: '#ffffff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  outlineText: {
    color: '#0f172a',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  secondaryText: {
    color: '#1f2937',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#0f172a',
  },
  link: {
    backgroundColor: 'transparent',
  },
  linkText: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  // Sizes
  defaultSize: {
    height: 44,
    paddingHorizontal: 16,
  },
  defaultSizeText: {
    fontSize: 14,
  },
  sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  smText: {
    fontSize: 12,
  },
  lg: {
    height: 52,
    paddingHorizontal: 24,
  },
  lgText: {
    fontSize: 16,
  },
  icon: {
    height: 44,
    width: 44,
    paddingHorizontal: 0,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
