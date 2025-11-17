export type ChallengeType = 'percentage' | 'habit' | 'metric' | 'steps';
export type ChallengeCategory = 'fitness' | 'learning' | 'productivity' | 'health' | 'finance' | 'social' | 'other';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export const challengeTypes: { value: ChallengeType; label: string; description: string }[] = [
  { value: 'percentage', label: 'Percentage Progress', description: 'Track progress from 0% to 100%' },
  { value: 'habit', label: 'Habit-Based', description: 'Complete a specific habit X times' },
  { value: 'metric', label: 'Metric-Based', description: 'Reach a numeric goal (books read, km run, etc.)' },
  { value: 'steps', label: 'Step Challenge', description: 'Track daily steps (requires mobile app)' },
];

export const challengeCategories: { value: ChallengeCategory; label: string; emoji: string }[] = [
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'productivity', label: 'Productivity', emoji: '⚡' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'other', label: 'Other', emoji: '🎯' },
];

export const difficultyLevels: { value: ChallengeDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'text-green-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'hard', label: 'Hard', color: 'text-red-500' },
];

export interface ChallengeTemplate {
  name: string;
  description: string;
  category: ChallengeCategory;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  duration: number; // days
  targetValue?: number; // for metric-based
}

export const challengeTemplates: ChallengeTemplate[] = [
  // Fitness
  { 
    name: '30-Day Plank Challenge', 
    description: 'Hold plank for 5 minutes by day 30',
    category: 'fitness',
    type: 'metric',
    difficulty: 'medium',
    duration: 30,
    targetValue: 300 // seconds
  },
  { 
    name: '100 Push-ups Challenge', 
    description: 'Build up to 100 push-ups in one session',
    category: 'fitness',
    type: 'percentage',
    difficulty: 'hard',
    duration: 60
  },
  { 
    name: 'Walk 10K Steps Daily', 
    description: '10,000 steps every day for 21 days',
    category: 'fitness',
    type: 'steps',
    difficulty: 'easy',
    duration: 21
  },
  
  // Learning
  { 
    name: 'Read 10 Books', 
    description: 'Read 10 books in 90 days',
    category: 'learning',
    type: 'metric',
    difficulty: 'medium',
    duration: 90,
    targetValue: 10
  },
  { 
    name: 'Learn 500 Words', 
    description: 'Master 500 new vocabulary words',
    category: 'learning',
    type: 'metric',
    difficulty: 'hard',
    duration: 60,
    targetValue: 500
  },
  { 
    name: 'Daily Learning Habit', 
    description: 'Learn something new every day for 30 days',
    category: 'learning',
    type: 'habit',
    difficulty: 'easy',
    duration: 30
  },
  
  // Productivity
  { 
    name: 'No Social Media for 7 Days', 
    description: 'Complete digital detox week',
    category: 'productivity',
    type: 'habit',
    difficulty: 'hard',
    duration: 7
  },
  { 
    name: 'Wake Up at 5 AM', 
    description: 'Early bird challenge for 21 days',
    category: 'productivity',
    type: 'habit',
    difficulty: 'hard',
    duration: 21
  },
  { 
    name: 'Complete 50 Tasks', 
    description: 'Finish 50 tasks in 30 days',
    category: 'productivity',
    type: 'metric',
    difficulty: 'medium',
    duration: 30,
    targetValue: 50
  },
  
  // Health
  { 
    name: 'Drink 3L Water Daily', 
    description: 'Stay hydrated for 30 days',
    category: 'health',
    type: 'habit',
    difficulty: 'easy',
    duration: 30
  },
  { 
    name: '30 Days Sugar-Free', 
    description: 'Eliminate added sugar for a month',
    category: 'health',
    type: 'habit',
    difficulty: 'hard',
    duration: 30
  },
  { 
    name: '21-Day Meditation', 
    description: 'Meditate daily for 21 days',
    category: 'health',
    type: 'habit',
    difficulty: 'medium',
    duration: 21
  },
  
  // Finance
  { 
    name: 'Save $1000 in 30 Days', 
    description: 'Savings challenge',
    category: 'finance',
    type: 'metric',
    difficulty: 'hard',
    duration: 30,
    targetValue: 1000
  },
  { 
    name: 'No Spend Week', 
    description: 'Don\'t spend money for 7 days',
    category: 'finance',
    type: 'habit',
    difficulty: 'medium',
    duration: 7
  },
  
  // Social
  { 
    name: 'Daily Acts of Kindness', 
    description: 'Do one kind thing every day',
    category: 'social',
    type: 'habit',
    difficulty: 'easy',
    duration: 21
  },
  { 
    name: 'Connect with 10 Friends', 
    description: 'Have meaningful conversations with 10 friends',
    category: 'social',
    type: 'metric',
    difficulty: 'easy',
    duration: 30,
    targetValue: 10
  },
];
