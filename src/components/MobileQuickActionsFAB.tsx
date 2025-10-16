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
}

export function MobileQuickActionsFAB({
  onAddTask,
  onAddExpense,
  onAddHabit,
  onAddChallenge,
  onStartFocus,
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

  // Get contextual icon based on current page
  const getFABIcon = () => {
    const path = location.pathname;
    if (path === '/habits') return CheckCircle;
    if (path === '/tasks') return ListPlus;
    if (path === '/expenses') return DollarSign;
    if (path === '/challenges') return Trophy;
    if (path === '/trips') return Plane;
    if (path === '/focus') return Brain;
    return Plus; // Default
  };

  const FABIcon = getFABIcon();

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB Menu */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
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
                  <span className="text-sm font-medium bg-card px-3 py-1.5 rounded-lg shadow-lg border">
                    {action.label}
                  </span>
                  <Button
                    size="lg"
                    className="rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform"
                    onClick={action.onClick}
                  >
                    <Icon className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB with Contextual Icon */}
        <Button
          size="lg"
          className={cn(
            'rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-all',
            isExpanded && 'rotate-45'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <FABIcon className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}
