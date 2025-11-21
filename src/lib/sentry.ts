import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { 
  createRoutesFromChildren, 
  matchRoutes, 
  useLocation, 
  useNavigationType 
} from "react-router-dom";

// Initialize Sentry only in production
export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Environment
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || "1.0.0",
      
      // Filter out known errors
      ignoreErrors: [
        // Network errors
        "NetworkError",
        "Network request failed",
        // Browser extensions
        "top.GLOBALS",
        "canvas.contentDocument",
      ],
      
      // Add user context
      beforeSend(event, hint) {
        // Filter out non-error events in development
        if (import.meta.env.DEV) {
          console.log("Sentry event:", event, hint);
          return null;
        }
        return event;
      },
    });
  }
};

// Error tracking utilities
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Error:", error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
};
