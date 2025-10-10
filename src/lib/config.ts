// Production configuration
export const config = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature flags
  features: {
    devTools: import.meta.env.DEV, // Only show dev tools in development
    analytics: import.meta.env.PROD, // Enable analytics in production
    errorReporting: import.meta.env.PROD, // Enable error reporting in production
  },
  
  // App metadata
  app: {
    name: 'Splitz',
    version: '1.0.0',
    description: 'Track habits, split expenses, and challenge friends',
  },
  
  // API endpoints
  api: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
} as const;

// Type-safe environment variable access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
  }
  return value || defaultValue || '';
};
