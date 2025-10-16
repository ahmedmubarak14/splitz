import { Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, Brain, DollarSign, Trophy, Menu, CreditCard, Plane, Calendar, Grid3X3, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { MobileDrawerNav } from './MobileDrawerNav';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

type NavItemId = 'dashboard' | 'habits' | 'tasks' | 'matrix' | 'focus' | 'calendar' | 'expenses' | 'subscriptions' | 'trips' | 'challenges';

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
  ];

  useEffect(() => {
    fetchNavPreferences();
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

  const visibleNavItems = allNavItems.filter(item => visibleNavIds.includes(item.id));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all hover:bg-accent/50"
          >
            <Menu className="w-[18px] h-[18px]" />
            <span className="text-[10px] font-medium">{t('nav.menu')}</span>
          </Button>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all',
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-medium">{item.label}</span>
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
