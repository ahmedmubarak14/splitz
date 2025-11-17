import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Target,
  DollarSign,
} from 'lucide-react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';

import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const CalendarScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: tasks } = useQuery({
    queryKey: ['calendar-tasks', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id || '')
        .not('due_date', 'is', null);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: habits } = useQuery({
    queryKey: ['calendar-habits', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id || '');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: expenses } = useQuery({
    queryKey: ['calendar-expenses', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id || '');
      return data || [];
    },
    enabled: !!user,
  });

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    const events: { type: string; count: number }[] = [];

    const dayTasks = tasks?.filter(
      (task: any) => task.due_date && isSameDay(parseISO(task.due_date), date)
    );
    if (dayTasks && dayTasks.length > 0) {
      events.push({ type: 'task', count: dayTasks.length });
    }

    const dayExpenses = expenses?.filter(
      (expense: any) => isSameDay(parseISO(expense.date), date)
    );
    if (dayExpenses && dayExpenses.length > 0) {
      events.push({ type: 'expense', count: dayExpenses.length });
    }

    return events;
  };

  const selectedDateTasks = tasks?.filter(
    (task: any) => task.due_date && isSameDay(parseISO(task.due_date), selectedDate)
  );

  const selectedDateExpenses = expenses?.filter(
    (expense: any) => isSameDay(parseISO(expense.date), selectedDate)
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.calendarCard}>
          <CardContent style={styles.calendarContent}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft color="#09090b" size={24} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight color="#09090b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const events = getEventsForDate(day);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayButton, isSelected && styles.daySelected]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.dayTextMuted,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    <View style={styles.eventDots}>
                      {events.map((event, i) => (
                        <View
                          key={i}
                          style={[
                            styles.eventDot,
                            event.type === 'task' && styles.taskDot,
                            event.type === 'expense' && styles.expenseDot,
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CardContent>
        </Card>

        <Text style={styles.selectedDateText}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>

        {selectedDateTasks && selectedDateTasks.length > 0 && (
          <Card style={styles.eventsCard}>
            <CardContent style={styles.eventsContent}>
              <View style={styles.eventTypeHeader}>
                <CheckSquare color="#6366f1" size={18} />
                <Text style={styles.eventTypeTitle}>Tasks</Text>
              </View>
              {selectedDateTasks.map((task: any) => (
                <View key={task.id} style={styles.eventItem}>
                  <Text style={styles.eventItemText}>{task.title}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedDateExpenses && selectedDateExpenses.length > 0 && (
          <Card style={styles.eventsCard}>
            <CardContent style={styles.eventsContent}>
              <View style={styles.eventTypeHeader}>
                <DollarSign color="#f59e0b" size={18} />
                <Text style={styles.eventTypeTitle}>Expenses</Text>
              </View>
              {selectedDateExpenses.map((expense: any) => (
                <View key={expense.id} style={styles.eventItem}>
                  <Text style={styles.eventItemText}>
                    {expense.description || expense.category} - ${expense.amount}
                  </Text>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {(!selectedDateTasks || selectedDateTasks.length === 0) &&
          (!selectedDateExpenses || selectedDateExpenses.length === 0) && (
            <View style={styles.noEvents}>
              <Text style={styles.noEventsText}>No events for this day</Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollContent: {
    padding: 16,
  },
  calendarCard: {
    marginBottom: 16,
  },
  calendarContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: '#6366f1',
  },
  dayText: {
    fontSize: 14,
    color: '#09090b',
  },
  dayTextMuted: {
    color: '#d4d4d8',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  eventDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  taskDot: {
    backgroundColor: '#6366f1',
  },
  expenseDot: {
    backgroundColor: '#f59e0b',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginBottom: 16,
  },
  eventsCard: {
    marginBottom: 12,
  },
  eventsContent: {
    padding: 16,
  },
  eventTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eventTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
  },
  eventItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  eventItemText: {
    fontSize: 14,
    color: '#09090b',
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 14,
    color: '#71717a',
  },
});
