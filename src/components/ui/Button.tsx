import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'default',
  size = 'default',
  loading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const variantStyles = {
    default: styles.variantDefault,
    secondary: styles.variantSecondary,
    destructive: styles.variantDestructive,
    outline: styles.variantOutline,
    ghost: styles.variantGhost,
  };

  const textVariantStyles = {
    default: styles.textDefault,
    secondary: styles.textSecondary,
    destructive: styles.textDestructive,
    outline: styles.textOutline,
    ghost: styles.textGhost,
  };

  const sizeStyles = {
    default: styles.sizeDefault,
    sm: styles.sizeSm,
    lg: styles.sizeLg,
    icon: styles.sizeIcon,
  };

  const textSizeStyles = {
    default: styles.textSizeDefault,
    sm: styles.textSizeSm,
    lg: styles.textSizeLg,
    icon: styles.textSizeDefault,
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' ? '#ffffff' : '#6366f1'}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text style={[textVariantStyles[variant], textSizeStyles[size]]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  variantDefault: {
    backgroundColor: '#6366f1',
  },
  variantSecondary: {
    backgroundColor: '#f4f4f5',
  },
  variantDestructive: {
    backgroundColor: '#ef4444',
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  textDefault: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textSecondary: {
    color: '#18181b',
    fontWeight: '600',
  },
  textDestructive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textOutline: {
    color: '#18181b',
    fontWeight: '600',
  },
  textGhost: {
    color: '#18181b',
    fontWeight: '600',
  },
  sizeDefault: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sizeSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sizeLg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  sizeIcon: {
    padding: 10,
  },
  textSizeDefault: {
    fontSize: 14,
  },
  textSizeSm: {
    fontSize: 12,
  },
  textSizeLg: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
