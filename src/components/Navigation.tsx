import { Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, Brain, DollarSign, Trophy, Menu, CreditCard, Plane, Calendar, Grid3X3, Flame, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { MobileDrawerNav } from './MobileDrawerNav';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  prefetchDashboard, 
  prefetchTasks, 
  prefetchHabits, 
  prefetchExpenses, 
  prefetchFocus, 
  prefetchChallenges 
} from '@/App';

type NavItemId = 'dashboard' | 'habits' | 'tasks' | 'matrix' | 'focus' | 'calendar' | 'expenses' | 'subscriptions' | 'trips' | 'challenges' | 'friends';

const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleNavIds, setVisibleNavIds] = useState<NavItemId[]>([
    'dashboard',
    'tasks',
    'focus',
    'expenses',
    'challenges',
  ]);

  // Dynamic item limiting based on screen size
  const getMaxVisibleItems = () => {
    const width = window.innerWidth;
    if (width < 360) return 4; // Menu + 3 items
    if (width < 400) return 5; // Menu + 4 items
    if (width < 500) return 6; // Menu + 5 items
    return 6; // Menu + 5 items (max)
  };

  const [maxItems, setMaxItems] = useState(getMaxVisibleItems());

  const allNavItems = [
    { id: 'dashboard' as NavItemId, path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { id: 'habits' as NavItemId, path: '/habits', icon: Flame, label: t('nav.habits') },
    { id: 'tasks' as NavItemId, path: '/tasks', icon: ListChecks, label: t('nav.tasks') },
    { id: 'matrix' as NavItemId, path: '/matrix', icon: Grid3X3, label: t('nav.matrix') },
    { id: 'focus' as NavItemId, path: '/focus', icon: Brain, label: t('nav.focus') },
    { id: 'calendar' as NavItemId, path: '/calendar', icon: Calendar, label: t('nav.calendar') },
    { id: 'expenses' as NavItemId, path: '/expenses', icon: DollarSign, label: t('nav.expenses') },
    { id: 'subscriptions' as NavItemId, path: '/subscriptions', icon: CreditCard, label: t('nav.subscriptions') },
    { id: 'trips' as NavItemId, path: '/trips', icon: Plane, label: t('nav.trips') },
    { id: 'challenges' as NavItemId, path: '/challenges', icon: Trophy, label: t('nav.challenges') },
    { id: 'friends' as NavItemId, path: '/friends', icon: Users, label: t('nav.friends') },
  ];

  useEffect(() => {
    fetchNavPreferences();
    
    const handleResize = () => {
      setMaxItems(getMaxVisibleItems());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNavPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('navigation_preferences')
      .select('visible_nav_items')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.visible_nav_items) {
      setVisibleNavIds(data.visible_nav_items as NavItemId[]);
    }
  };

  // Prefetch handler
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

  const visibleNavItems = allNavItems.filter(item => visibleNavIds.includes(item.id));
  const displayedNavItems = visibleNavItems.slice(0, maxItems - 1); // -1 for Menu button
  const hasOverflow = visibleNavItems.length > maxItems - 1;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 md:hidden shadow-lg">
        <div className="mobile-nav-container">
          {/* Hamburger Menu */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'mobile-nav-item',
              'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Menu className="flex-shrink-0" />
            <span>{t('nav.menu')}</span>
            {hasOverflow && <div className="mobile-nav-overflow-indicator" />}
          </button>

          {displayedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => handlePrefetch(item.path)}
                onTouchStart={() => handlePrefetch(item.path)}
                className={cn(
                  'mobile-nav-item',
                  isActive
                    ? 'text-primary active'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Drawer Navigation */}
      <MobileDrawerNav 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen}
        onNavigationChange={fetchNavPreferences}
      />
    </>
  );
};

export default Navigation;
