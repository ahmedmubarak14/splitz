import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { Input, Button, Select, TextArea } from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const habitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.string().min(1, 'Frequency is required'),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface CreateHabitFormProps {
  onSuccess: () => void;
}

export const CreateHabitForm = ({ onSuccess }: CreateHabitFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      description: '',
      frequency: 'daily',
    },
  });

  const createHabit = useMutation({
    mutationFn: async (data: HabitFormData) => {
      const { error } = await supabase.from('habits').insert({
        user_id: user?.id || '',
        name: data.name,
        description: data.description || null,
        frequency: data.frequency,
        current_streak: 0,
        longest_streak: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      Toast.show({
        type: 'success',
        text1: 'Habit Created',
        text2: 'Your habit has been added successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create habit',
      });
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Habit Name"
            placeholder="Enter habit name"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
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
            placeholder="Add habit description (optional)"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="frequency"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Frequency"
            placeholder="Select frequency"
            options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
            ]}
            value={value}
            onValueChange={onChange}
            error={errors.frequency?.message}
          />
        )}
      />

      <View style={styles.buttonSpacer} />

      <Button
        onPress={handleSubmit((data) => createHabit.mutate(data))}
        loading={createHabit.isPending}
      >
        Create Habit
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
