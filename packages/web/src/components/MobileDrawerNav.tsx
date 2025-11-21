import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import NavigationCustomizer from './NavigationCustomizer';
import {
  Home,
  ListChecks,
  Grid3x3,
  Brain,
  Trophy,
  CalendarDays,
  DollarSign,
  CreditCard,
  MapPin,
  User,
  Settings,
  LogOut,
  Users,
} from 'lucide-react';
import { 
  prefetchDashboard, 
  prefetchTasks, 
  prefetchHabits, 
  prefetchExpenses, 
  prefetchFocus, 
  prefetchChallenges 
} from '@/App';

interface MobileDrawerNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigationChange?: () => void;
}

export function MobileDrawerNav({ open, onOpenChange, onNavigationChange }: MobileDrawerNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const navigationGroups = [
    {
      title: t('nav.quickAccess'),
      items: [
        { path: '/dashboard', icon: Home, label: t('nav.dashboard'), emoji: '🏠' },
      ],
    },
    {
      title: t('nav.productivity'),
      items: [
        { path: '/tasks', icon: ListChecks, label: t('nav.tasks'), emoji: '✅' },
        { path: '/matrix', icon: Grid3x3, label: t('nav.matrix'), emoji: '📊' },
        { path: '/focus', icon: Brain, label: t('nav.focus'), emoji: '🎯' },
        { path: '/habits', icon: Trophy, label: t('nav.habits'), emoji: '🔥' },
        { path: '/calendar', icon: CalendarDays, label: t('nav.calendar'), emoji: '📅' },
      ],
    },
    {
      title: t('nav.financial'),
      items: [
        { path: '/expenses', icon: DollarSign, label: t('nav.expenses'), emoji: '💰' },
        { path: '/subscriptions', icon: CreditCard, label: t('nav.subscriptions'), emoji: '💳' },
        { path: '/trips', icon: MapPin, label: t('nav.trips'), emoji: '✈️' },
      ],
    },
    {
      title: t('nav.social'),
      items: [
        { path: '/friends', icon: Users, label: t('nav.friends'), emoji: '👥' },
        { path: '/challenges', icon: Trophy, label: t('nav.challenges'), emoji: '🏆' },
      ],
    },
    {
      title: t('nav.account'),
      items: [
        { path: '/profile', icon: User, label: t('nav.profile'), emoji: '👤' },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handlePrefetch = (path: string) => {
    switch(path) {
      case '/dashboard': prefetchDashboard(); break;
      case '/tasks': prefetchTasks(); break;
      case '/habits': prefetchHabits(); break;
      case '/expenses': prefetchExpenses(); break;
      case '/focus': prefetchFocus(); break;
      case '/challenges': prefetchChallenges(); break;
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
        {/* Profile Header */}
        <SheetHeader className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage 
                src={profile?.avatar_url} 
                loading="lazy"
                decoding="async"
              />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-semibold truncate">
                {profile?.full_name || t('profile.welcome')}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {t('nav.manageYourLife')}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Customizer */}
        <div className="px-4 pt-4">
          <NavigationCustomizer onSave={() => {
            onNavigationChange?.();
            onOpenChange(false);
          }} />
        </div>

        <Separator className="my-4" />

        {/* Navigation Groups */}
        <div className="py-4">
          {navigationGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-2">
              <h3 className="px-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-1 px-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      onMouseEnter={() => handlePrefetch(item.path)}
                      onTouchStart={() => handlePrefetch(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-accent/50'
                      )}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
              {groupIndex < navigationGroups.length - 1 && (
                <Separator className="my-3" />
              )}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">{t('auth.signOut')}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
