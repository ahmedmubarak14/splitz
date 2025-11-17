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

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(5),
  due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  due_date: string | null;
}

interface EditTaskFormProps {
  task: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaskForm = ({ task, onSuccess, onCancel }: EditTaskFormProps) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || '',
    },
  });

  useEffect(() => {
    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
  }, [task, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          due_date: data.due_date || null,
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Task updated',
        text2: 'Your task has been updated successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update task',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Toast.show({
        type: 'success',
        text1: 'Task deleted',
        text2: 'Your task has been deleted',
      });
      onSuccess();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete task',
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    updateMutation.mutate(data);
  };

  const priorityOptions = [
    { label: '1 - Lowest', value: 1 },
    { label: '2 - Low', value: 2 },
    { label: '3 - Medium', value: 3 },
    { label: '4 - High', value: 4 },
    { label: '5 - Highest', value: 5 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Edit Task</Text>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Title"
            placeholder="Task title"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Description"
            placeholder="Task description (optional)"
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
        name="priority"
        render={({ field: { onChange, value } }) => (
          <View style={styles.priorityContainer}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityButtons}>
              {priorityOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => onChange(option.value)}
                  style={styles.priorityButton}
                >
                  {option.value.toString()}
                </Button>
              ))}
            </View>
            {errors.priority && (
              <Text style={styles.errorText}>{errors.priority.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="due_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Due Date"
            placeholder="YYYY-MM-DD"
            value={value}
            onChangeText={onChange}
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
          Delete Task
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
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
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
