import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Plus, DollarSign, CheckCircle, Trophy, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsRTL } from '@/lib/rtl-utils';

interface QuickActionsHubProps {
  focusMinutesThisWeek: number;
}

export function QuickActionsHub({ focusMinutesThisWeek }: QuickActionsHubProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const quickActions = [
    {
      icon: Brain,
      title: t('dashboard.startFocusSession') || 'Start Focus',
      subtitle: `${focusMinutesThisWeek} ${t('dashboard.minutesThisWeek') || 'min this week'}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      onClick: () => navigate('/focus')
    },
    {
      icon: Plus,
      title: t('dashboard.addTask') || 'Add Task',
      subtitle: t('dashboard.quickCapture') || 'Quick capture',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/tasks')
    },
    {
      icon: DollarSign,
      title: t('dashboard.logExpense') || 'Log Expense',
      subtitle: t('dashboard.trackSpending') || 'Track spending',
      color: 'text-success',
      bgColor: 'bg-success/10',
      onClick: () => navigate('/expenses')
    },
    {
      icon: CheckCircle,
      title: t('dashboard.checkHabit') || 'Check Habit',
      subtitle: t('dashboard.buildStreak') || 'Build your streak',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      onClick: () => navigate('/habits')
    },
    {
      icon: Trophy,
      title: t('dashboard.createChallenge') || 'New Challenge',
      subtitle: t('dashboard.setGoal') || 'Set a new goal',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      onClick: () => navigate('/challenges')
    }
  ];

  return (
    <Card className="bg-background border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className={`flex items-center gap-2 md:gap-3 mb-4 md:mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="inline-flex p-2 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <h3 className="text-base md:text-lg font-semibold tracking-tight">
            {t('dashboard.quickActions') || 'Quick Actions'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`${action.bgColor} rounded-lg p-4 md:p-5 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:ring-2 ring-primary/20 ring-offset-2 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <action.icon className={`h-6 w-6 md:h-7 md:w-7 ${action.color} mb-3`} />
              <div className="text-sm md:text-base font-medium text-foreground mb-1">
                {action.title}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {action.subtitle}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
