import { Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, Brain, DollarSign, Trophy, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MobileDrawerNav } from './MobileDrawerNav';
import { Button } from './ui/button';

const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { path: '/tasks', icon: ListChecks, label: t('nav.tasks') || 'Tasks' },
    { path: '/focus', icon: Brain, label: t('nav.focus') || 'Focus' },
    { path: '/expenses', icon: DollarSign, label: t('nav.expenses') },
    { path: '/challenges', icon: Trophy, label: t('nav.challenges') },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-accent/50"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">{t('nav.menu') || 'Menu'}</span>
          </Button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Drawer Navigation */}
      <MobileDrawerNav open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default Navigation;
