import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ListPlus, Brain, DollarSign, CheckCircle, Sparkles, Trophy, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface MobileQuickActionsFABProps {
  onAddTask?: () => void;
  onAddExpense?: () => void;
  onAddHabit?: () => void;
  onAddChallenge?: () => void;
  onStartFocus?: () => void;
  onAddTrip?: () => void;
  onAddSubscription?: () => void;
}

export function MobileQuickActionsFAB({
  onAddTask,
  onAddExpense,
  onAddHabit,
  onAddChallenge,
  onStartFocus,
  onAddTrip,
  onAddSubscription,
}: MobileQuickActionsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  if (!isMobile) return null;

  const getContextualActions = (): QuickAction[] => {
    const path = location.pathname;

    if (path === '/tasks') {
      return [
        {
          icon: ListPlus,
          label: t('quickActions.addTask'),
          onClick: () => {
            onAddTask?.();
            setIsExpanded(false);
          },
        },
        {
          icon: Brain,
          label: t('quickActions.focus'),
          onClick: () => {
            navigate('/focus');
            setIsExpanded(false);
          },
        },
      ];
    }

    if (path === '/habits') {
      return [
        {
          icon: CheckCircle,
          label: t('quickActions.addHabit'),
          onClick: () => {
            onAddHabit?.();
            setIsExpanded(false);
          },
        },
        {
          icon: Sparkles,
          label: t('quickActions.quickCheckIn'),
          onClick: () => {
            // Quick check-in action
            setIsExpanded(false);
          },
        },
      ];
    }

    if (path === '/expenses') {
      return [
        {
          icon: DollarSign,
          label: t('quickActions.addExpense'),
          onClick: () => {
            onAddExpense?.();
            setIsExpanded(false);
          },
        },
        {
          icon: Plus,
          label: t('quickActions.createGroup'),
          onClick: () => {
            // Create group action
            setIsExpanded(false);
          },
        },
      ];
    }

    if (path === '/challenges') {
      return [
        {
          icon: Sparkles,
          label: t('quickActions.newChallenge'),
          onClick: () => {
            onAddChallenge?.();
            setIsExpanded(false);
          },
        },
      ];
    }

    if (path === '/trips') {
      return [
        {
          icon: Plane,
          label: t('quickActions.planTrip'),
          onClick: () => {
            onAddTrip?.();
            setIsExpanded(false);
          },
        },
      ];
    }

    if (path === '/subscriptions') {
      return [
        {
          icon: DollarSign,
          label: t('quickActions.trackSubscription'),
          onClick: () => {
            onAddSubscription?.();
            setIsExpanded(false);
          },
        },
      ];
    }

    // Default actions for other pages
    return [
      {
        icon: ListPlus,
        label: t('quickActions.addTask'),
        onClick: () => {
          navigate('/tasks');
          setIsExpanded(false);
        },
      },
      {
        icon: Brain,
        label: t('quickActions.startFocus'),
        onClick: () => {
          navigate('/focus');
          setIsExpanded(false);
        },
      },
    ];
  };

  const actions = getContextualActions();

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Menu */}
      <div className="fixed right-4 z-50 flex flex-col items-end gap-3" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Mini FABs */}
        {isExpanded && (
          <div className="flex flex-col gap-3 animate-scale-in">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-sm font-semibold bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border border-border/40 whitespace-nowrap">
                    {action.label}
                  </span>
                  <Button
                    size="lg"
                    className={cn(
                      'rounded-full w-14 h-14 shadow-xl hover:shadow-2xl',
                      'hover:scale-110 active:scale-95',
                      'transition-all duration-200',
                      'border border-border/40'
                    )}
                    onClick={action.onClick}
                  >
                    <Icon className="w-6 h-6" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB - Always Plus Icon */}
        <Button
          size="lg"
          className={cn(
            'rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl',
            'bg-gradient-to-br from-primary to-primary/80',
            'hover:scale-110 active:scale-95',
            'transition-all duration-300 ease-out',
            'border-2 border-background',
            isExpanded && 'rotate-45 scale-110'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </Button>
      </div>
    </>
  );
}
