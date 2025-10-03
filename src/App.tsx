import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Search, Bell, Sun, ChevronDown } from "lucide-react";
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
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

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
        <main className="flex-1 w-full bg-muted/30">
          <header className="sticky top-0 z-40 bg-background border-b border-border/20">
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-muted rounded-lg p-2 transition-colors" />
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                    L
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                      <span>›</span>
                      <span className="text-foreground font-medium capitalize">
                        {location.pathname.split('/')[1] || 'Dashboard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                  <Search className="h-[18px] w-[18px]" />
                </Button>
                <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                  <Sun className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </header>
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
