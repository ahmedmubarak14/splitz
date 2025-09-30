import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        habits: 'Habits',
        expenses: 'Expenses',
        challenges: 'Challenges',
        profile: 'Profile',
      },
      // Common
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        share: 'Share',
        close: 'Close',
        loading: 'Loading...',
      },
      // Home
      home: {
        welcome: 'Welcome to LinkUp',
        subtitle: 'Track habits, split expenses, and challenge friends—all in one place',
        getStarted: 'Get Started',
        login: 'Login',
        signup: 'Sign Up',
      },
      // Habits
      habits: {
        title: 'Habit Streaks',
        createNew: 'Create New Habit',
        currentStreak: 'Current Streak',
        bestStreak: 'Best Streak',
        checkIn: 'Check In',
        days: 'days',
        myHabits: 'My Habits',
        noHabits: 'No habits yet. Create your first one!',
      },
      // Expenses
      expenses: {
        title: 'Expense Splitter',
        createGroup: 'Create Group',
        addExpense: 'Add Expense',
        youOwe: 'You owe',
        owesYou: 'owes you',
        settled: 'Settled up',
        groups: 'Groups',
        noGroups: 'No groups yet. Create your first one!',
      },
      // Challenges
      challenges: {
        title: 'Friend Challenges',
        createChallenge: 'Create Challenge',
        join: 'Join',
        leaderboard: 'Leaderboard',
        progress: 'Progress',
        active: 'Active Challenges',
        noChallenges: 'No challenges yet. Create or join one!',
      },
    },
  },
  ar: {
    translation: {
      // Navigation
      nav: {
        home: 'الرئيسية',
        habits: 'العادات',
        expenses: 'المصاريف',
        challenges: 'التحديات',
        profile: 'الملف الشخصي',
      },
      // Common
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        share: 'مشاركة',
        close: 'إغلاق',
        loading: 'جاري التحميل...',
      },
      // Home
      home: {
        welcome: 'مرحباً في LinkUp',
        subtitle: 'تتبع العادات، قسم المصاريف، وتحدَّ أصدقائك—كل شيء في مكان واحد',
        getStarted: 'ابدأ الآن',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
      },
      // Habits
      habits: {
        title: 'سلاسل العادات',
        createNew: 'إنشاء عادة جديدة',
        currentStreak: 'السلسلة الحالية',
        bestStreak: 'أفضل سلسلة',
        checkIn: 'تسجيل حضور',
        days: 'أيام',
        myHabits: 'عاداتي',
        noHabits: 'لا توجد عادات بعد. أنشئ الأولى!',
      },
      // Expenses
      expenses: {
        title: 'تقسيم المصاريف',
        createGroup: 'إنشاء مجموعة',
        addExpense: 'إضافة مصروف',
        youOwe: 'أنت مدين بـ',
        owesYou: 'مدين لك',
        settled: 'تم التسوية',
        groups: 'المجموعات',
        noGroups: 'لا توجد مجموعات بعد. أنشئ الأولى!',
      },
      // Challenges
      challenges: {
        title: 'تحديات الأصدقاء',
        createChallenge: 'إنشاء تحدي',
        join: 'انضمام',
        leaderboard: 'لوحة المتصدرين',
        progress: 'التقدم',
        active: 'التحديات النشطة',
        noChallenges: 'لا توجد تحديات بعد. أنشئ أو انضم لواحد!',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
