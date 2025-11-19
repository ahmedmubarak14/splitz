import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { Input, Button, Select, DatePicker, TextArea } from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.date(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface CreateExpenseFormProps {
  onSuccess: () => void;
}

export const CreateExpenseForm = ({ onSuccess }: CreateExpenseFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      category: 'other',
      description: '',
      date: new Date(),
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const { error } = await supabase.from('expenses').insert({
        user_id: user?.id || '',
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description || null,
        date: data.date.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.show({
        type: 'success',
        text1: 'Expense Added',
        text2: 'Your expense has been recorded successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add expense',
      });
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount"
            placeholder="0.00"
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            error={errors.amount?.message}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Category"
            placeholder="Select category"
            options={[
              { label: 'Food', value: 'food' },
              { label: 'Transport', value: 'transport' },
              { label: 'Entertainment', value: 'entertainment' },
              { label: 'Shopping', value: 'shopping' },
              { label: 'Bills', value: 'bills' },
              { label: 'Health', value: 'health' },
              { label: 'Other', value: 'other' },
            ]}
            value={value}
            onValueChange={onChange}
            error={errors.category?.message}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Date"
            value={value}
            onChange={onChange}
            error={errors.date?.message}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <TextArea
            label="Description"
            placeholder="Add description (optional)"
            value={value}
            onChangeText={onChange}
            numberOfLines={3}
          />
        )}
      />

      <View style={styles.buttonSpacer} />

      <Button
        onPress={handleSubmit((data) => createExpense.mutate(data))}
        loading={createExpense.isPending}
      >
        Add Expense
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  spacer: {
    height: 16,
  },
  buttonSpacer: {
    height: 24,
  },
});
