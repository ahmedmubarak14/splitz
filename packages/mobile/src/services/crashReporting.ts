import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Crash Reporting Service using Sentry
 * Captures crashes, errors, and performance data
 */

export interface CrashReportingConfig {
  dsn: string;
  environment?: 'development' | 'staging' | 'production';
  enableInDev?: boolean;
  tracesSampleRate?: number;
  enableAutoSessionTracking?: boolean;
}

class CrashReportingService {
  private isInitialized: boolean = false;

  /**
   * Initialize Sentry crash reporting
   */
  initialize(config: CrashReportingConfig): void {
    const {
      dsn,
      environment = __DEV__ ? 'development' : 'production',
      enableInDev = false,
      tracesSampleRate = 1.0,
      enableAutoSessionTracking = true,
    } = config;

    // Don't initialize in development unless explicitly enabled
    if (__DEV__ && !enableInDev) {
      console.log('🐛 Crash reporting disabled in development');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release: Constants.expoConfig?.version || '1.0.0',
        dist: Constants.expoConfig?.ios?.buildNumber?.toString() ||
              Constants.expoConfig?.android?.versionCode?.toString() || '1',

        // Performance monitoring
        tracesSampleRate,
        enableAutoSessionTracking,

        // Capture breadcrumbs
        attachStacktrace: true,
        maxBreadcrumbs: 50,

        // Native crash support
        enableNative: true,
        enableNativeCrashHandling: true,

        // Debug options
        debug: __DEV__,

        // Integrations
        integrations: [
          new Sentry.ReactNativeTracing({
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            tracingOrigins: ['localhost', /^\//],
          }),
        ],

        // Before send hook - filter sensitive data
        beforeSend(event, hint) {
          // Filter out sensitive information
          if (event.request?.cookies) {
            delete event.request.cookies;
          }

          if (event.user?.email) {
            event.user.email = event.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
          }

          return event;
        },

        // Before breadcrumb hook - filter sensitive breadcrumbs
        beforeBreadcrumb(breadcrumb) {
          // Filter out sensitive data from breadcrumbs
          if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
            // Remove query parameters that might contain tokens
            breadcrumb.data.url = breadcrumb.data.url.split('?')[0];
          }

          return breadcrumb;
        },
      });

      this.isInitialized = true;
      console.log('🐛 Crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(user: {
    id: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    console.log('🐛 User context set:', user.id);
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
    console.log('🐛 User context cleared');
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.setContext(name, context);
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    Sentry.setTag(key, value);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error' | 'debug';
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Capture error
   */
  captureError(error: Error, context?: Record<string, any>): string | undefined {
    if (!this.isInitialized) {
      console.error('Error (not reported):', error);
      return undefined;
    }

    return Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    context?: Record<string, any>
  ): string | undefined {
    if (!this.isInitialized) {
      console.log(`Message (not reported): ${message}`);
      return undefined;
    }

    return Sentry.captureMessage(message, {
      level,
      contexts: context ? { custom: context } : undefined,
    });
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string = 'custom'): Sentry.Transaction | undefined {
    if (!this.isInitialized) return undefined;

    return Sentry.startTransaction({ name, op });
  }

  /**
   * Wrap component with error boundary
   */
  wrap<P extends object>(
    component: React.ComponentType<P>
  ): React.ComponentType<P> {
    if (!this.isInitialized) return component;

    return Sentry.wrap(component);
  }

  /**
   * Test crash reporting (for debugging only)
   */
  testCrash(): void {
    if (!this.isInitialized) {
      console.log('Cannot test crash - Sentry not initialized');
      return;
    }

    console.log('🐛 Testing crash reporting...');
    Sentry.captureMessage('Test crash report from Splitz app');
  }

  /**
   * Test native crash (for debugging only)
   */
  testNativeCrash(): void {
    if (!this.isInitialized) {
      console.log('Cannot test native crash - Sentry not initialized');
      return;
    }

    console.log('🐛 Testing native crash...');
    Sentry.nativeCrash();
  }
}

// Export singleton instance
export const crashReporting = new CrashReportingService();

// Export for easier imports
export default crashReporting;
