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

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.date().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export const CreateTaskForm = ({ onSuccess }: CreateTaskFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const { error } = await supabase.from('tasks').insert({
        user_id: user?.id || '',
        title: data.title,
        description: data.description || null,
        priority: data.priority || null,
        due_date: data.due_date?.toISOString() || null,
        is_complete: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Task Created',
        text2: 'Your task has been added successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create task',
      });
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
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
            placeholder="Add task description (optional)"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="priority"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Priority"
            placeholder="Select priority"
            options={[
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]}
            value={value}
            onValueChange={onChange}
          />
        )}
      />

      <View style={styles.spacer} />

      <Controller
        control={control}
        name="due_date"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            label="Due Date"
            placeholder="Select due date (optional)"
            value={value}
            onChange={onChange}
          />
        )}
      />

      <View style={styles.buttonSpacer} />

      <Button
        onPress={handleSubmit((data) => createTask.mutate(data))}
        loading={createTask.isPending}
      >
        Create Task
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
