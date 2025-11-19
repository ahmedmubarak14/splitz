import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        back: 'Back',
        next: 'Next',
        done: 'Done',
        skip: 'Skip',
      },
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password?',
        resetPassword: 'Reset Password',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
      },
      tabs: {
        dashboard: 'Dashboard',
        tasks: 'Tasks',
        habits: 'Habits',
        expenses: 'Expenses',
        profile: 'Profile',
      },
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back',
        todayTasks: "Today's Tasks",
        activeHabits: 'Active Habits',
        monthlyExpenses: 'Monthly Expenses',
      },
      tasks: {
        title: 'Tasks',
        addTask: 'Add Task',
        taskTitle: 'Task Title',
        description: 'Description',
        priority: 'Priority',
        dueDate: 'Due Date',
        completed: 'Completed',
        pending: 'Pending',
      },
      habits: {
        title: 'Habits',
        addHabit: 'Add Habit',
        habitName: 'Habit Name',
        frequency: 'Frequency',
        streak: 'Streak',
        daily: 'Daily',
        weekly: 'Weekly',
      },
      expenses: {
        title: 'Expenses',
        addExpense: 'Add Expense',
        amount: 'Amount',
        category: 'Category',
        date: 'Date',
        notes: 'Notes',
      },
      trips: {
        title: 'Trips',
        addTrip: 'Add Trip',
        tripName: 'Trip Name',
        destination: 'Destination',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      onboarding: {
        welcome: 'Welcome to Splitz',
        getStarted: 'Get Started',
        slide1Title: 'Track Your Tasks',
        slide1Description: 'Stay organized and never miss a deadline',
        slide2Title: 'Build Better Habits',
        slide2Description: 'Create lasting habits with streak tracking',
        slide3Title: 'Manage Expenses',
        slide3Description: 'Keep track of your spending and split costs',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18n;
