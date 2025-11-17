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

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
}

interface EditHabitFormProps {
  habit: Habit;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditHabitForm = ({ habit, onSuccess, onCancel }: EditHabitFormProps) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      target_count: habit.target_count,
    },
  });

  useEffect(() => {
    reset({
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      target_count: habit.target_count,
    });
  }, [habit, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: HabitFormData) => {
      const { error } = await supabase
        .from('habits')
        .update({
          name: data.name,
          description: data.description || null,
          frequency: data.frequency,
          target_count: data.target_count,
        })
        .eq('id', habit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      Toast.show({
        type: 'success',
        text1: 'Habit updated',
        text2: 'Your habit has been updated successfully',
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update habit',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('habits').delete().eq('id', habit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      Toast.show({
        type: 'success',
        text1: 'Habit deleted',
        text2: 'Your habit has been deleted',
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete habit',
      });
    },
  });

  const onSubmit = (data: HabitFormData) => {
    updateMutation.mutate(data);
  };

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' as const },
    { label: 'Weekly', value: 'weekly' as const },
    { label: 'Monthly', value: 'monthly' as const },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Edit Habit</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Name"
            placeholder="Habit name"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description"
            placeholder="Habit description (optional)"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        )}
      />

      <Controller
        control={control}
        name="frequency"
        render={({ field: { onChange, value } }) => (
          <View style={styles.frequencyContainer}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyButtons}>
              {frequencyOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => onChange(option.value)}
                  style={styles.frequencyButton}
                >
                  {option.label}
                </Button>
              ))}
            </View>
            {errors.frequency && (
              <Text style={styles.errorText}>{errors.frequency.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="target_count"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Target Count"
            placeholder="Number of times"
            value={value.toString()}
            onChangeText={(text) => onChange(parseInt(text) || 1)}
            keyboardType="number-pad"
            error={errors.target_count?.message}
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
          Delete Habit
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
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
