/**
 * Generate localized sample data for live activity
 */

export interface LiveStreak {
  user: string;
  habit: string;
  streak: number;
  lastCheckIn: Date;
}

export interface RecentSplit {
  group: string;
  total: number;
  members: Array<{ name: string; delta: number | 'settled' }>;
}

/**
 * Get sample habit names by language
 */
const getHabitNames = (language: string): string[] => {
  if (language === 'ar') {
    return ['الجري الصباحي', 'القراءة', 'التأمل', 'شرب الماء'];
  }
  return ['Morning Run', 'Reading', 'Meditation', 'Hydration'];
};

/**
 * Get sample user names by language
 */
const getUserNames = (language: string): string[] => {
  if (language === 'ar') {
    return ['سارة م.', 'أحمد ك.', 'ليلى ت.', 'عمر س.'];
  }
  return ['Sarah M.', 'Ahmed K.', 'Layla T.', 'Omar S.'];
};

/**
 * Get sample group names by language
 */
const getGroupNames = (language: string): string[] => {
  if (language === 'ar') {
    return ['رحلة نهاية الأسبوع', 'حفلة عشاء', 'اشتراك النادي', 'قهوة'];
  }
  return ['Weekend Trip', 'Dinner Party', 'Gym Membership', 'Coffee Run'];
};

/**
 * Generate sample live streaks
 */
export const generateLiveStreaks = (language: string = 'en'): LiveStreak[] => {
  const userNames = getUserNames(language);
  const habitNames = getHabitNames(language);
  
  const now = new Date();
  
  return [
    {
      user: userNames[0],
      habit: habitNames[0],
      streak: 21,
      lastCheckIn: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      user: userNames[1],
      habit: habitNames[1],
      streak: 45,
      lastCheckIn: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      user: userNames[2],
      habit: habitNames[2],
      streak: 12,
      lastCheckIn: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      user: userNames[3],
      habit: habitNames[3],
      streak: 7,
      lastCheckIn: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
    },
  ];
};

/**
 * Generate sample recent splits
 */
export const generateRecentSplits = (language: string = 'en'): RecentSplit[] => {
  const groupNames = getGroupNames(language);
  
  return [
    {
      group: groupNames[0],
      total: 450,
      members: [{ name: 'You', delta: 12 }],
    },
    {
      group: groupNames[1],
      total: 280,
      members: [{ name: 'You', delta: -15 }],
    },
    {
      group: groupNames[2],
      total: 120,
      members: [{ name: 'You', delta: 40 }],
    },
    {
      group: groupNames[3],
      total: 65,
      members: [{ name: 'You', delta: 'settled' }],
    },
  ];
};
