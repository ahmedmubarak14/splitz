import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Search, Bell, Sun, Home } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Expenses from "./pages/Expenses";
import Challenges from "./pages/Challenges";
import Profile from "./pages/Profile";
import JoinInvite from "./pages/JoinInvite";
import NotFound from "./pages/NotFound";
import './i18n/config';

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

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

  if (isLandingPage || isAuthPage) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/join/:inviteCode" element={<JoinInvite />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 w-full bg-background">
          <header className="sticky top-0 z-40 bg-background border-b border-border/30">
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-muted rounded-md p-1.5 transition-colors" />
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                    L
                  </div>
                  <span className="text-sm font-semibold">LinkUp</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-md h-9 w-9">
                  <Search className="h-[18px] w-[18px]" />
                </Button>
                <Button variant="ghost" size="icon" className="relative rounded-md h-9 w-9">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-md h-9 w-9">
                  <Sun className="h-[18px] w-[18px]" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold ml-1">
                  M
                </div>
              </div>
            </div>
          </header>
          <div className="bg-background border-b border-border/30 px-6 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              <span className="text-muted-foreground/40">›</span>
              <span className="text-foreground font-medium capitalize">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </span>
            </nav>
          </div>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/join/:inviteCode" element={<JoinInvite />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Navigation />
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
