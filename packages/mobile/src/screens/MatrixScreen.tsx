import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, Calendar, Trash2 } from 'lucide-react-native';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/Card';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  due_date: string | null;
  is_completed: boolean;
  quadrant?: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
}

const { width } = Dimensions.get('window');
const quadrantWidth = (width - 48) / 2;

export const MatrixScreen = () => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-matrix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Categorize tasks into quadrants based on priority and due date
      return (data || []).map((task: Task) => {
        const isUrgent = task.due_date
          ? new Date(task.due_date).getTime() - Date.now() < 48 * 60 * 60 * 1000
          : false;
        const isImportant = task.priority >= 3;

        let quadrant: Task['quadrant'];
        if (isUrgent && isImportant) {
          quadrant = 'urgent-important';
        } else if (!isUrgent && isImportant) {
          quadrant = 'not-urgent-important';
        } else if (isUrgent && !isImportant) {
          quadrant = 'urgent-not-important';
        } else {
          quadrant = 'not-urgent-not-important';
        }

        return { ...task, quadrant };
      });
    },
  });

  const getQuadrantTasks = (quadrant: Task['quadrant']) => {
    return tasks.filter((task) => task.quadrant === quadrant);
  };

  const quadrants = [
    {
      key: 'urgent-important',
      title: 'Do First',
      subtitle: 'Urgent & Important',
      color: '#ef4444',
      bgColor: '#fef2f2',
      icon: AlertCircle,
    },
    {
      key: 'not-urgent-important',
      title: 'Schedule',
      subtitle: 'Not Urgent & Important',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      icon: Calendar,
    },
    {
      key: 'urgent-not-important',
      title: 'Delegate',
      subtitle: 'Urgent & Not Important',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      icon: Clock,
    },
    {
      key: 'not-urgent-not-important',
      title: 'Eliminate',
      subtitle: 'Not Urgent & Not Important',
      color: '#6b7280',
      bgColor: '#f9fafb',
      icon: Trash2,
    },
  ];

  const renderTaskItem = (task: Task) => (
    <View key={task.id} style={styles.taskItem}>
      <Text style={styles.taskTitle} numberOfLines={1}>
        {task.title}
      </Text>
      {task.due_date && (
        <Text style={styles.taskDueDate}>
          {new Date(task.due_date).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading matrix...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eisenhower Matrix</Text>
        <Text style={styles.headerSubtitle}>
          Prioritize tasks by urgency and importance
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.matrixContainer}>
          <View style={styles.row}>
            {quadrants.slice(0, 2).map((quadrant) => {
              const Icon = quadrant.icon;
              const quadrantTasks = getQuadrantTasks(quadrant.key as Task['quadrant']);

              return (
                <TouchableOpacity
                  key={quadrant.key}
                  style={[
                    styles.quadrant,
                    { backgroundColor: quadrant.bgColor },
                    selectedQuadrant === quadrant.key && styles.selectedQuadrant,
                  ]}
                  onPress={() =>
                    setSelectedQuadrant(
                      selectedQuadrant === quadrant.key ? null : quadrant.key
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.quadrantHeader}>
                    <Icon size={20} color={quadrant.color} />
                    <Text
                      style={[styles.quadrantTitle, { color: quadrant.color }]}
                    >
                      {quadrant.title}
                    </Text>
                  </View>
                  <Text style={styles.quadrantSubtitle}>{quadrant.subtitle}</Text>
                  <View style={styles.taskCount}>
                    <Text style={[styles.taskCountText, { color: quadrant.color }]}>
                      {quadrantTasks.length}
                    </Text>
                  </View>
                  <ScrollView
                    style={styles.taskList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {quadrantTasks.slice(0, 3).map(renderTaskItem)}
                    {quadrantTasks.length > 3 && (
                      <Text style={styles.moreText}>
                        +{quadrantTasks.length - 3} more
                      </Text>
                    )}
                  </ScrollView>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            {quadrants.slice(2, 4).map((quadrant) => {
              const Icon = quadrant.icon;
              const quadrantTasks = getQuadrantTasks(quadrant.key as Task['quadrant']);

              return (
                <TouchableOpacity
                  key={quadrant.key}
                  style={[
                    styles.quadrant,
                    { backgroundColor: quadrant.bgColor },
                    selectedQuadrant === quadrant.key && styles.selectedQuadrant,
                  ]}
                  onPress={() =>
                    setSelectedQuadrant(
                      selectedQuadrant === quadrant.key ? null : quadrant.key
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.quadrantHeader}>
                    <Icon size={20} color={quadrant.color} />
                    <Text
                      style={[styles.quadrantTitle, { color: quadrant.color }]}
                    >
                      {quadrant.title}
                    </Text>
                  </View>
                  <Text style={styles.quadrantSubtitle}>{quadrant.subtitle}</Text>
                  <View style={styles.taskCount}>
                    <Text style={[styles.taskCountText, { color: quadrant.color }]}>
                      {quadrantTasks.length}
                    </Text>
                  </View>
                  <ScrollView
                    style={styles.taskList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {quadrantTasks.slice(0, 3).map(renderTaskItem)}
                    {quadrantTasks.length > 3 && (
                      <Text style={styles.moreText}>
                        +{quadrantTasks.length - 3} more
                      </Text>
                    )}
                  </ScrollView>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedQuadrant && (
          <Card style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {quadrants.find((q) => q.key === selectedQuadrant)?.title} Tasks
            </Text>
            {getQuadrantTasks(selectedQuadrant as Task['quadrant']).map((task) => (
              <View key={task.id} style={styles.detailTaskItem}>
                <Text style={styles.detailTaskTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.detailTaskDescription}>
                    {task.description}
                  </Text>
                )}
                {task.due_date && (
                  <Text style={styles.detailTaskDueDate}>
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
            {getQuadrantTasks(selectedQuadrant as Task['quadrant']).length === 0 && (
              <Text style={styles.emptyText}>No tasks in this quadrant</Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  matrixContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  quadrant: {
    width: quadrantWidth,
    height: 200,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuadrant: {
    borderColor: '#6366f1',
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quadrantTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quadrantSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskCount: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  taskCountText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  taskDueDate: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  moreText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  detailCard: {
    marginTop: 16,
    padding: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  detailTaskItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailTaskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  detailTaskDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  detailTaskDueDate: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
