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
          <header className="sticky top-0 z-40 bg-background/95 border-b border-border/20 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-muted rounded-xl p-2.5 transition-all" />
                <div className="flex flex-col">
                  <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
                    <span>›</span>
                    <span className="text-foreground font-medium capitalize">{(location.pathname.split('/')[1] || 'dashboard').replace(/(^.|-.)/g, s => s.replace('-', '').toUpperCase())}</span>
                  </nav>
                  <h1 className="text-lg font-semibold tracking-tight capitalize">{(location.pathname.split('/')[1] || 'dashboard').replace(/(^.|-.)/g, s => s.replace('-', '').toUpperCase())}</h1>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none flex items-center justify-center">2</span>
                  <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Sun className="h-5 w-5" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button variant="outline" className="h-9 rounded-full px-3">
                  <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium mr-2">M</span>
                  <span className="hidden sm:inline text-sm">Account</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
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
