import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        habits: 'Habits',
        expenses: 'Expenses',
        challenges: 'Challenges',
        profile: 'Profile',
        features: 'Features',
        howItWorks: 'How it Works',
        pricing: 'Pricing',
        faq: 'FAQ',
        login: 'Login',
        getStarted: 'Get Started',
      },
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
      hero: {
        badge: 'Habits · Challenges · Expense Splitter',
        title: 'Build habits together. Split life fairly.',
        subtitle: 'Nudges via Push & WhatsApp. No email. No spam.',
      },
      cta: {
        start: 'Start Free',
        how: 'See How It Works',
        learnMore: 'Learn More',
      },
      tabs: {
        users: 'Users',
        friends: 'Friends',
      },
      showcase: {
        users: {
          title: 'For You',
          feature1: '🔥 Track habit streaks',
          feature2: '📱 Push reminders',
          feature3: '💬 WhatsApp pings',
        },
        friends: {
          title: 'With Friends',
          feature1: '🏆 Group challenges',
          feature2: '📊 Leaderboards',
          feature3: '💸 Expense settle-up',
        },
      },
      trust: {
        rating: 'User Rating',
        load: 'Avg. Load',
        uptime: 'Uptime',
        privacy: 'Privacy',
      },
      live: {
        streaks: 'Live Streaks',
        splits: 'Recent Splits',
        avgCheckIn: 'Avg time to check-in',
        avgSettle: 'Avg settle time',
      },
      features: {
        title: 'Everything You Need',
        subtitle: 'All your daily essentials in one beautiful app',
        streaks: {
          title: 'Habit Streaks',
          desc: 'Build consistency with streak tracking and daily check-ins',
        },
        challenges: {
          title: 'Friend Challenges',
          desc: 'Compete and grow together with group challenges',
        },
        splitter: {
          title: 'Expense Splitter',
          desc: 'Split expenses fairly with smart settlement links',
        },
        reminders: {
          title: 'Push + WhatsApp',
          desc: 'Get timely nudges where you actually see them',
        },
      },
      howItWorks: {
        title: 'How It Works',
        subtitle: 'Get started in three simple steps',
        step1: {
          title: 'Create & Invite',
          desc: 'Set up habits or groups, invite friends',
        },
        step2: {
          title: 'Track & Compete',
          desc: 'Start challenges, log expenses, build streaks',
        },
        step3: {
          title: 'Get Nudged & Settle',
          desc: 'Push & WhatsApp reminders keep you on track',
        },
      },
      pricing: {
        title: 'Simple Pricing',
        subtitle: 'Start free, upgrade when ready',
        free: {
          title: 'Free',
          price: '$0',
          desc: 'Perfect for getting started',
          cta: 'Start Free',
        },
        pro: {
          title: 'Pro',
          price: 'Coming Soon',
          desc: 'Advanced features for power users',
          cta: 'Coming Soon',
        },
      },
      final: {
        title: 'Make better habits with friends',
        subtitle: 'Join thousands building streaks and splitting life fairly',
      },
      footer: {
        tagline: 'Build habits together. Split life fairly.',
        rights: 'All rights reserved.',
      },
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
      nav: {
        habits: 'العادات',
        expenses: 'المصاريف',
        challenges: 'التحديات',
        profile: 'الملف الشخصي',
        features: 'المميزات',
        howItWorks: 'كيف تعمل',
        pricing: 'الأسعار',
        faq: 'الأسئلة',
        login: 'تسجيل الدخول',
        getStarted: 'ابدأ الآن',
      },
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
      hero: {
        badge: 'عادات · تحديات · تقسيم المصاريف',
        title: 'ابنِ العادات معاً. واقسم المصاريف بعدل.',
        subtitle: 'تنبيهات عبر الإشعارات وواتساب فقط. بلا بريد إلكتروني أو إزعاج.',
      },
      cta: {
        start: 'ابدأ مجاناً',
        how: 'شاهد كيف تعمل',
        learnMore: 'اعرف المزيد',
      },
      tabs: {
        users: 'للمستخدمين',
        friends: 'للأصدقاء',
      },
      showcase: {
        users: {
          title: 'لك',
          feature1: '🔥 تتبع سلاسل العادات',
          feature2: '📱 تنبيهات الإشعارات',
          feature3: '💬 رسائل واتساب',
        },
        friends: {
          title: 'مع الأصدقاء',
          feature1: '🏆 تحديات جماعية',
          feature2: '📊 لوحات المتصدرين',
          feature3: '💸 تسوية المصاريف',
        },
      },
      trust: {
        rating: 'تقييم المستخدمين',
        load: 'متوسط التحميل',
        uptime: 'الاستمرارية',
        privacy: 'الخصوصية',
      },
      live: {
        streaks: 'سلاسل مباشرة',
        splits: 'تقسيمات حديثة',
        avgCheckIn: 'متوسط وقت التسجيل',
        avgSettle: 'متوسط وقت التسوية',
      },
      features: {
        title: 'كل ما تحتاجه',
        subtitle: 'كل احتياجاتك اليومية في تطبيق واحد جميل',
        streaks: {
          title: 'سلاسل العادات',
          desc: 'بناء الاستمرارية مع تتبع السلاسل والتسجيل اليومي',
        },
        challenges: {
          title: 'تحديات الأصدقاء',
          desc: 'تنافس وانمُ معاً بتحديات جماعية',
        },
        splitter: {
          title: 'تقسيم المصاريف',
          desc: 'قسّم المصاريف بعدالة مع روابط تسوية ذكية',
        },
        reminders: {
          title: 'إشعارات + واتساب',
          desc: 'احصل على تنبيهات في الوقت المناسب حيث تراها فعلاً',
        },
      },
      howItWorks: {
        title: 'كيف تعمل',
        subtitle: 'ابدأ في ثلاث خطوات بسيطة',
        step1: {
          title: 'أنشئ وادعُ',
          desc: 'أعد عادات أو مجموعات، وادعُ أصدقاءك',
        },
        step2: {
          title: 'تتبع وتنافس',
          desc: 'ابدأ التحديات، سجل المصاريف، ابنِ السلاسل',
        },
        step3: {
          title: 'احصل على تنبيهات وسوّي',
          desc: 'تنبيهات الإشعارات وواتساب تبقيك على المسار',
        },
      },
      pricing: {
        title: 'أسعار بسيطة',
        subtitle: 'ابدأ مجاناً، وترقّى عندما تكون جاهزاً',
        free: {
          title: 'مجاني',
          price: '$0',
          desc: 'مثالي للبداية',
          cta: 'ابدأ مجاناً',
        },
        pro: {
          title: 'احترافي',
          price: 'قريباً',
          desc: 'مميزات متقدمة للمستخدمين المحترفين',
          cta: 'قريباً',
        },
      },
      final: {
        title: 'كوِّن عادات أفضل مع أصدقائك',
        subtitle: 'انضم إلى الآلاف الذين يبنون السلاسل ويقسمون الحياة بعدالة',
      },
      footer: {
        tagline: 'ابنِ العادات معاً. واقسم المصاريف بعدل.',
        rights: 'جميع الحقوق محفوظة.',
      },
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
