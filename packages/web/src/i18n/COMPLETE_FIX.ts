// This file contains all the missing translation keys that need to be added to src/i18n/config.ts
// Copy these into the appropriate sections of the English (en) and Arabic (ar) translation objects

export const ENGLISH_ADDITIONS = {
  // Add to en.translation.sharedHabits
  sharedHabits: {
    completed: 'Completed',
    noSharedHabits: 'No Shared Habits Yet',
    noSharedHabitsDesc: 'Create or join shared habits with friends to track progress together',
    createSharedHabit: 'Create Shared Habit',
    browseShared: 'Browse Shared Habits',
    createDialogTitle: 'Create Shared Habit',
    createDialogDesc: 'Start a new habit and invite friends to join you',
    chooseIcon: 'Choose Icon',
    changeIcon: 'Change Icon',
    habitName: 'Habit Name',
    habitNamePlaceholder: 'e.g., Morning Meditation',
    descriptionOptional: 'Description (optional)',
    descriptionPlaceholder: 'What does this habit involve?',
    targetDays: 'Target Days',
    targetDaysPresets: {
      thirtyDays: '30 days',
      sixtyDays: '60 days',
      ninetyDays: '90 days',
      custom: 'Custom',
    },
    enterDaysPlaceholder: 'Enter number of days',
    category: 'Category',
    categories: {
      health: 'Health & Fitness',
      productivity: 'Productivity',
      mindfulness: 'Mindfulness',
      learning: 'Learning',
      social: 'Social',
      other: 'Other',
    },
    visibility: 'Visibility',
    visibilityOptions: {
      private: 'Private (invite only)',
      friends_only: 'Friends Only',
      public: 'Public (anyone can join)',
    },
    inviteParticipants: 'Invite Participants (optional)',
    inviteDesc: 'Search for users by @username or invite friends',
    searchByUsername: 'Search by @username',
    createAndInvite: 'Create & Invite',
    createHabit: 'Create Habit',
    creating: 'Creating...',
    enterHabitName: 'Please enter a habit name',
    enterValidDays: 'Please enter a valid number of days (1-365)',
    habitCreated: 'Shared habit created!',
    createFailed: 'Failed to create habit',
    inviteNotification: 'New Habit Invitation',
    inviteMessage: '{{inviter}} invited you to join "{{habit}}"',
  },

  // Add to en.translation.trips
  trips: {
    editTrip: 'Edit Trip',
    tripUpdated: 'Trip updated successfully',
    nameRequired: 'Trip name is required',
    invalidDates: 'Invalid dates',
    selectDate: 'Select date',
    createTask: 'Create Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title...',
    taskDescription: 'Description',
    taskDescriptionPlaceholder: 'Add task details...',
    taskCreated: 'Task created successfully',
    taskTitleRequired: 'Task title is required',
    dueDate: 'Due Date',
    assignToEveryone: 'Assign to Everyone',
    assignTo: 'Assign To',
    selectMember: 'Select a member',
    unassigned: 'Unassigned',
    priority: {
      label: 'Priority',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    status: {
      label: 'Status',
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    },
  },

  // Add to en.translation.common
  common: {
    creating: 'Creating...',
    updating: 'Updating...',
    update: 'Update',
  },

  // Add to en.translation.errors
  errors: {
    createFailed: 'Failed to create',
    updateFailed: 'Failed to update',
  },

  // Add to en.translation.security
  security: {
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
  },
};

export const ARABIC_ADDITIONS = {
  // Add to ar.translation.sharedHabits
  sharedHabits: {
    completed: 'مكتمل',
    noSharedHabits: 'لا توجد عادات مشتركة بعد',
    noSharedHabitsDesc: 'انضم أو أنشئ عادةً مشتركة لتتبع التقدم مع الأصدقاء',
    createSharedHabit: 'إنشاء عادة مشتركة',
    browseShared: 'تصفح العادات المشتركة',
    createDialogTitle: 'إنشاء عادة مشتركة',
    createDialogDesc: 'ابدأ عادة جديدة وادعُ أصدقاءك للانضمام إليك',
    chooseIcon: 'اختر رمزاً',
    changeIcon: 'تغيير الرمز',
    habitName: 'اسم العادة',
    habitNamePlaceholder: 'مثل، تأمل صباحي',
    descriptionOptional: 'الوصف (اختياري)',
    descriptionPlaceholder: 'ماذا تتضمن هذه العادة؟',
    targetDays: 'الأيام المستهدفة',
    targetDaysPresets: {
      thirtyDays: '30 يوماً',
      sixtyDays: '60 يوماً',
      ninetyDays: '90 يوماً',
      custom: 'مخصص',
    },
    enterDaysPlaceholder: 'أدخل عدد الأيام',
    category: 'الفئة',
    categories: {
      health: 'صحة ولياقة',
      productivity: 'إنتاجية',
      mindfulness: 'وعي ذهني',
      learning: 'تعلم',
      social: 'اجتماعي',
      other: 'أخرى',
    },
    visibility: 'الظهور',
    visibilityOptions: {
      private: 'خاص (بالدعوة فقط)',
      friends_only: 'الأصدقاء فقط',
      public: 'عام (يمكن للجميع الانضمام)',
    },
    inviteParticipants: 'دعوة مشاركين (اختياري)',
    inviteDesc: 'ابحث عن مستخدمين بـ @اسم_المستخدم أو ادعُ أصدقاء',
    searchByUsername: 'ابحث بـ @اسم_المستخدم',
    createAndInvite: 'إنشاء ودعوة',
    createHabit: 'إنشاء عادة',
    creating: 'جارٍ الإنشاء...',
    enterHabitName: 'الرجاء إدخال اسم العادة',
    enterValidDays: 'الرجاء إدخال عدد صحيح من الأيام (1-365)',
    habitCreated: 'تم إنشاء العادة المشتركة!',
    createFailed: 'فشل إنشاء العادة',
    inviteNotification: 'دعوة عادة جديدة',
    inviteMessage: '{{inviter}} دعاك للانضمام إلى "{{habit}}"',
  },

  // Add to ar.translation.trips
  trips: {
    editTrip: 'تعديل الرحلة',
    tripUpdated: 'تم تحديث الرحلة بنجاح',
    nameRequired: 'اسم الرحلة مطلوب',
    invalidDates: 'التواريخ غير صحيحة',
    selectDate: 'اختر تاريخاً',
    createTask: 'إنشاء مهمة',
    taskTitle: 'عنوان المهمة',
    taskTitlePlaceholder: 'أدخل عنوان المهمة...',
    taskDescription: 'الوصف',
    taskDescriptionPlaceholder: 'أضف تفاصيل المهمة...',
    taskCreated: 'تم إنشاء المهمة',
    taskTitleRequired: 'عنوان المهمة مطلوب',
    dueDate: 'تاريخ الاستحقاق',
    assignToEveryone: 'تعيين للجميع',
    assignTo: 'تعيين إلى',
    selectMember: 'اختر عضواً',
    unassigned: 'غير معيّن',
    priority: {
      label: 'الأولوية',
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
    },
    status: {
      label: 'الحالة',
      todo: 'للقيام به',
      in_progress: 'قيد التنفيذ',
      done: 'منجز',
    },
  },

  // Add to ar.translation.common
  common: {
    creating: 'جارٍ الإنشاء...',
    updating: 'جارٍ التحديث...',
    update: 'تحديث',
  },

  // Add to ar.translation.errors
  errors: {
    createFailed: 'فشل الإنشاء',
    updateFailed: 'فشل التحديث',
  },

  // Add to ar.translation.security
  security: {
    changePassword: 'تغيير كلمة المرور',
    deleteAccount: 'حذف الحساب',
  },
};
