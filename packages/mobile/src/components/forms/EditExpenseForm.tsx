import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface EditExpenseFormProps {
  expense: Expense;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditExpenseForm = ({
  expense,
  onSuccess,
  onCancel,
}: EditExpenseFormProps) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
    },
  });

  useEffect(() => {
    reset({
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
    });
  }, [expense, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: data.date,
        })
        .eq('id', expense.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.show({
        type: 'success',
        text1: 'Expense updated',
        text2: 'Your expense has been updated successfully',
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update expense',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.show({
        type: 'success',
        text1: 'Expense deleted',
        text2: 'Your expense has been deleted',
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete expense',
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    updateMutation.mutate(data);
  };

  const categoryOptions = [
    'Food',
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills',
    'Health',
    'Other',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Edit Expense</Text>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount"
            placeholder="0.00"
            value={value.toString()}
            onChangeText={(text) => onChange(parseFloat(text) || 0)}
            keyboardType="decimal-pad"
            error={errors.amount?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description"
            placeholder="What was this expense for?"
            value={value}
            onChangeText={onChange}
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <View style={styles.categoryContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryButtons}>
              {categoryOptions.map((category) => (
                <Button
                  key={category}
                  variant={value === category ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => onChange(category)}
                  style={styles.categoryButton}
                >
                  {category}
                </Button>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
            error={errors.date?.message}
          />
        )}
      />

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit(onSubmit)}
          loading={updateMutation.isPending}
          style={styles.button}
        >
          Save Changes
        </Button>
        <Button variant="outline" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onPress={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
          style={styles.button}
        >
          Delete Expense
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 6,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    width: '100%',
  },
});
