import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/native-mobile.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Capacitor } from '@capacitor/core';
import { setupIonicReact } from '@ionic/react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { initSentry } from './lib/sentry';

// Initialize error monitoring
initSentry();

// Only initialize Ionic for native apps to avoid breaking web scrolling
if (Capacitor.isNativePlatform()) {
  setupIonicReact({
    mode: 'ios',
    rippleEffect: true,
    animated: true,
  });
}


// Wrapper component for offline detection
const AppWrapper = () => {
  useOfflineDetection(); // Automatically monitors online/offline status
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AppWrapper />
  </ErrorBoundary>
);
