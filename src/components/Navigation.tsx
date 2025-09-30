import { Link, useLocation } from 'react-router-dom';
import { Home, Target, DollarSign, Trophy, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/habits', icon: Target, label: t('nav.habits') },
    { path: '/expenses', icon: DollarSign, label: t('nav.expenses') },
    { path: '/challenges', icon: Trophy, label: t('nav.challenges') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-4">
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
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'animate-bounce')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
