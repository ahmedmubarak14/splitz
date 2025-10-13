import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HeaderActions } from "@/components/HeaderActions";
import Navigation from "@/components/Navigation";
import { NativeMobileNavigation } from "@/components/NativeMobileNavigation";
import { MobileAppRouter } from "@/components/MobileAppRouter";
import { Home } from "lucide-react";
import splitzLogo from "@/assets/splitz-logo.png";
import { useIsRTL } from "@/lib/rtl-utils";
import { isNativeApp, getPlatformClass } from "@/lib/platform";
import './i18n/config';

// Lazy load all pages for route-based code splitting
// Index is also lazy loaded for maximum bundle size reduction
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Habits = lazy(() => import("./pages/Habits"));
const Focus = lazy(() => import("./pages/Focus"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Profile = lazy(() => import("./pages/Profile"));
const DevTools = lazy(() => import("./pages/DevTools"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const JoinInvite = lazy(() => import("./pages/JoinInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Enhanced loading fallback with brand styling
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

// Optimized React Query configuration for better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      retry: 1, // Retry failed requests once
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

  // Native app: Skip landing page, go straight to auth/dashboard
  if (isNativeApp && isLandingPage) {
    return <MobileAppRouter />;
  }

  const handleLogoClick = () => {
    const now = Date.now();
    const lastClick = parseInt(sessionStorage.getItem('lastLogoClick') || '0');
    
    if (now - lastClick < 500) {
      // Double click - go to home
      navigate('/');
      sessionStorage.removeItem('lastLogoClick');
    } else {
      // Single click - go to dashboard
      navigate('/dashboard');
      sessionStorage.setItem('lastLogoClick', now.toString());
    }
  };

  if (isLandingPage || isAuthPage || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/onboarding' || location.pathname === '/auth/callback') {
    return (
      <div className={getPlatformClass()}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {!isNativeApp && <Route path="/" element={<Index />} />}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/join/:inviteCode" element={<JoinInvite />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dev-tools" element={<DevTools />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full ${getPlatformClass()}`}>
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <main className="flex-1 w-full bg-background">
          <header className="sticky top-0 z-40 bg-background border-b border-border/30" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="h-16 flex items-center justify-between px-4 md:px-6">
              {isRTL ? (
                <>
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="hidden md:flex hover:bg-accent rounded-lg p-2 transition-colors border border-border shadow-sm h-9 w-9 items-center justify-center" />
                    <button
                      onClick={handleLogoClick}
                      className="flex items-center hover:opacity-80 transition-opacity"
                    >
                      <img src={splitzLogo} alt="Splitz" className="h-8" loading="lazy" />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <HeaderActions />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="hidden md:flex hover:bg-accent rounded-lg p-2 transition-colors border border-border shadow-sm h-9 w-9 items-center justify-center" />
                    <button 
                      onClick={handleLogoClick}
                      className="flex items-center hover:opacity-80 transition-opacity"
                    >
                      <img src={splitzLogo} alt="Splitz" className="h-8" loading="lazy" />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <HeaderActions />
                  </div>
                </>
              )}
            </div>
          </header>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/join/:inviteCode" element={<JoinInvite />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/focus" element={<Focus />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dev-tools" element={<DevTools />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          {isNativeApp ? <NativeMobileNavigation /> : <Navigation />}
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
