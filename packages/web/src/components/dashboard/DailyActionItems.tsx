import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ActionItem {
  id: string;
  title: string;
  type: 'habit' | 'task' | 'expense' | 'challenge';
  urgency: 'high' | 'medium' | 'low' | 'overdue';
  action: string;
  route: string;
}

interface DailyActionItemsProps {
  habitsDue: number;
  tasksDue: number;
  expensesPending: number;
  challengesActive: number;
}

export const DailyActionItems = ({
  habitsDue,
  tasksDue,
  expensesPending,
  challengesActive
}: DailyActionItemsProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();

  const actions: ActionItem[] = [];

  if (habitsDue > 0) {
    actions.push({
      id: 'habits',
      title: t('insights.suggestions.checkHabits', { count: habitsDue }),
      type: 'habit',
      urgency: 'high',
      action: t('actionItems.checkIn'),
      route: '/habits'
    });
  }

  if (tasksDue > 0) {
    actions.push({
      id: 'tasks',
      title: t('insights.suggestions.completeTask'),
      type: 'task',
      urgency: tasksDue > 3 ? 'overdue' : 'high',
      action: t('actionItems.complete'),
      route: '/tasks'
    });
  }

  if (expensesPending > 0) {
    actions.push({
      id: 'expenses',
      title: t('insights.suggestions.reviewExpenses'),
      type: 'expense',
      urgency: 'medium',
      action: t('actionItems.review'),
      route: '/expenses'
    });
  }

  if (challengesActive === 0) {
    actions.push({
      id: 'challenges',
      title: t('insights.suggestions.joinChallenge'),
      type: 'challenge',
      urgency: 'low',
      action: 'Join',
      route: '/challenges'
    });
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'high':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-primary" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      overdue: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[urgency as keyof typeof variants] || 'outline';
  };

  if (actions.length === 0) {
    return (
      <Card className="border border-border/40 shadow-sm">
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('actionItems.noActions')}</h3>
          <p className="text-sm text-muted-foreground">
            You're on top of everything today!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <TrendingUp className="w-5 h-5" />
          {t('actionItems.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-accent/50 transition-all duration-200 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              {getUrgencyIcon(action.urgency)}
              <div className="flex-1">
                <p className="text-sm font-medium">{action.title}</p>
                <Badge
                  variant={getUrgencyBadge(action.urgency) as any}
                  className="text-xs mt-1"
                >
                  {t(`insights.urgency.${action.urgency}`)}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(action.route)}
              className="shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
            >
              {action.action}
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};