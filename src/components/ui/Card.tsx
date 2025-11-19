import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card = ({ children, style, ...props }: CardProps) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export const CardHeader = ({ children, style, ...props }: CardHeaderProps) => {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  style?: object;
}

export const CardTitle = ({ children, style }: CardTitleProps) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: object;
}

export const CardDescription = ({ children, style }: CardDescriptionProps) => {
  return <Text style={[styles.description, style]}>{children}</Text>;
};

interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export const CardContent = ({ children, style, ...props }: CardContentProps) => {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
};

interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
}

export const CardFooter = ({ children, style, ...props }: CardFooterProps) => {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  description: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  footer: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
