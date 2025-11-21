/**
 * Analytics Service
 * Tracks user events, screen views, and app metrics
 * Ready to integrate with Firebase Analytics, Amplitude, Mixpanel, etc.
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  plan?: 'free' | 'premium';
  signupDate?: Date;
  [key: string]: any;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private userProperties: UserProperties = {};

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    console.log('📊 Analytics service initialized');

    // TODO: Initialize your analytics provider here
    // Examples:
    // - Firebase: await analytics().setAnalyticsCollectionEnabled(true);
    // - Amplitude: Amplitude.getInstance().init(API_KEY);
    // - Mixpanel: Mixpanel.sharedInstanceWithToken(TOKEN);
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'}`);

    // TODO: Update analytics provider settings
    // Example: await analytics().setAnalyticsCollectionEnabled(enabled);
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
    console.log('📊 User ID set:', userId);

    if (!this.isEnabled) return;

    // TODO: Set user ID in analytics provider
    // Examples:
    // - Firebase: await analytics().setUserId(userId);
    // - Amplitude: Amplitude.getInstance().setUserId(userId);
    // - Mixpanel: Mixpanel.identify(userId);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    console.log('📊 User properties set:', properties);

    if (!this.isEnabled) return;

    // TODO: Set user properties in analytics provider
    // Examples:
    // - Firebase: await analytics().setUserProperties(properties);
    // - Amplitude: Amplitude.getInstance().setUserProperties(properties);
    // - Mixpanel: Mixpanel.set(properties);
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        timestamp: Date.now(),
      },
    };

    console.log('📊 Event tracked:', event);

    // TODO: Send event to analytics provider
    // Examples:
    // - Firebase: await analytics().logEvent(eventName, properties);
    // - Amplitude: Amplitude.getInstance().logEvent(eventName, properties);
    // - Mixpanel: Mixpanel.track(eventName, properties);
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });

    // TODO: Screen tracking for analytics provider
    // Examples:
    // - Firebase: await analytics().logScreenView({ screen_name: screenName });
    // - Amplitude: Amplitude.getInstance().logEvent('Screen View', { screen_name: screenName });
  }

  // ============================================
  // Pre-defined Events for Common Actions
  // ============================================

  /**
   * Track user signup
   */
  trackSignup(method: 'email' | 'google' | 'apple' = 'email'): void {
    this.trackEvent('signup', { method });
  }

  /**
   * Track user login
   */
  trackLogin(method: 'email' | 'google' | 'apple' | 'biometric' = 'email'): void {
    this.trackEvent('login', { method });
  }

  /**
   * Track user logout
   */
  trackLogout(): void {
    this.trackEvent('logout');
  }

  /**
   * Track task creation
   */
  trackTaskCreated(taskData: { priority?: number; hasDueDate?: boolean }): void {
    this.trackEvent('task_created', taskData);
  }

  /**
   * Track task completion
   */
  trackTaskCompleted(taskId: string): void {
    this.trackEvent('task_completed', { taskId });
  }

  /**
   * Track task deletion
   */
  trackTaskDeleted(taskId: string): void {
    this.trackEvent('task_deleted', { taskId });
  }

  /**
   * Track habit creation
   */
  trackHabitCreated(habitData: { frequency?: string; hasReminder?: boolean }): void {
    this.trackEvent('habit_created', habitData);
  }

  /**
   * Track habit check-in
   */
  trackHabitCheckedIn(habitId: string, streak?: number): void {
    this.trackEvent('habit_checked_in', { habitId, streak });
  }

  /**
   * Track expense creation
   */
  trackExpenseCreated(expenseData: { amount?: number; category?: string }): void {
    this.trackEvent('expense_created', {
      amount: expenseData.amount,
      category: expenseData.category,
    });
  }

  /**
   * Track trip creation
   */
  trackTripCreated(tripData: { duration?: number; budget?: number }): void {
    this.trackEvent('trip_created', tripData);
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount?: number): void {
    this.trackEvent('search', { query, resultsCount });
  }

  /**
   * Track settings changed
   */
  trackSettingsChanged(setting: string, value: any): void {
    this.trackEvent('settings_changed', { setting, value });
  }

  /**
   * Track notification sent
   */
  trackNotificationSent(notificationType: string): void {
    this.trackEvent('notification_sent', { type: notificationType });
  }

  /**
   * Track notification opened
   */
  trackNotificationOpened(notificationType: string): void {
    this.trackEvent('notification_opened', { type: notificationType });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsed(featureName: string, context?: Record<string, any>): void {
    this.trackEvent('feature_used', { feature: featureName, ...context });
  }

  /**
   * Track error (non-crash)
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Track app performance
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance', { metric, value, unit });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionType: string, value?: number): void {
    this.trackEvent('conversion', { type: conversionType, value });
  }

  /**
   * Track A/B test participation
   */
  trackExperiment(experimentName: string, variant: string): void {
    this.trackEvent('experiment', { experiment: experimentName, variant });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export for easier imports
export default analytics;
