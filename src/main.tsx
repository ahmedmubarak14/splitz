import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/native-mobile.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import * as Sentry from "@sentry/react";
import { Capacitor } from '@capacitor/core';
import { setupIonicReact } from '@ionic/react';

// Only initialize Ionic for native apps to avoid breaking web scrolling
if (Capacitor.isNativePlatform()) {
  setupIonicReact({
    mode: 'ios',
    rippleEffect: true,
    animated: true,
  });
}

// Initialize Sentry in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Global error logging for better diagnostics
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  if (import.meta.env.PROD) {
    Sentry.captureException(e.reason);
  }
});

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e);
  if (import.meta.env.PROD) {
    Sentry.captureException(e.error || e);
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
