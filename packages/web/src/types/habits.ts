export type HabitCategory = 'health' | 'productivity' | 'fitness' | 'learning' | 'social' | 'mindfulness' | 'finance' | 'other';

export const habitCategories: { value: HabitCategory; label: string; emoji: string }[] = [
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { value: 'productivity', label: 'Productivity', emoji: '⚡' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

export interface HabitTemplate {
  name: string;
  icon: string;
  category: HabitCategory;
  description: string;
  targetDays: number;
}

export const habitTemplates: HabitTemplate[] = [
  // Health
  { name: 'Drink 8 Glasses of Water', icon: '💧', category: 'health', description: 'Stay hydrated throughout the day', targetDays: 30 },
  { name: 'Take Vitamins', icon: '💊', category: 'health', description: 'Daily vitamin supplement', targetDays: 30 },
  { name: 'Sleep 8 Hours', icon: '😴', category: 'health', description: 'Get quality rest every night', targetDays: 30 },
  
  // Fitness
  { name: 'Morning Workout', icon: '🏃', category: 'fitness', description: 'Start your day with exercise', targetDays: 30 },
  { name: '10,000 Steps', icon: '👟', category: 'fitness', description: 'Walk 10,000 steps daily', targetDays: 30 },
  { name: 'Stretch for 10 Minutes', icon: '🤸', category: 'fitness', description: 'Daily stretching routine', targetDays: 21 },
  
  // Mindfulness
  { name: 'Meditate for 10 Minutes', icon: '🧘', category: 'mindfulness', description: 'Daily meditation practice', targetDays: 21 },
  { name: 'Gratitude Journal', icon: '📝', category: 'mindfulness', description: 'Write 3 things you\'re grateful for', targetDays: 30 },
  { name: 'Deep Breathing', icon: '🌬️', category: 'mindfulness', description: '5 minutes of deep breathing', targetDays: 21 },
  
  // Productivity
  { name: 'Wake Up at 6 AM', icon: '⏰', category: 'productivity', description: 'Early morning routine', targetDays: 30 },
  { name: 'No Phone Before 9 AM', icon: '📵', category: 'productivity', description: 'Digital detox morning', targetDays: 21 },
  { name: 'Plan Tomorrow Tonight', icon: '📅', category: 'productivity', description: 'Evening planning routine', targetDays: 30 },
  
  // Learning
  { name: 'Read for 30 Minutes', icon: '📖', category: 'learning', description: 'Daily reading habit', targetDays: 30 },
  { name: 'Learn a New Word', icon: '📝', category: 'learning', description: 'Expand vocabulary daily', targetDays: 30 },
  { name: 'Practice Language', icon: '🗣️', category: 'learning', description: '15 minutes language practice', targetDays: 30 },
  
  // Social
  { name: 'Call a Friend', icon: '📞', category: 'social', description: 'Stay connected with friends', targetDays: 7 },
  { name: 'Compliment Someone', icon: '💬', category: 'social', description: 'Spread positivity', targetDays: 21 },
  
  // Finance
  { name: 'Track Expenses', icon: '💰', category: 'finance', description: 'Log daily spending', targetDays: 30 },
  { name: 'Save $10', icon: '💵', category: 'finance', description: 'Daily savings challenge', targetDays: 30 },
];
