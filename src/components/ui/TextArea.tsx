import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface TextAreaProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string;
  numberOfLines?: number;
}

export const TextArea = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  numberOfLines = 4,
}: TextAreaProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#09090b',
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
