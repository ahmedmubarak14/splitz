import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Target, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/rtl-utils';
import { motion } from 'framer-motion';

interface PersonalizedInsightsProps {
  longestStreak: number;
  focusMinutes: number;
  habitsCompleted: number;
  weeklyGoal: number;
}

export const PersonalizedInsights = ({
  longestStreak,
  focusMinutes,
  habitsCompleted,
  weeklyGoal = 7
}: PersonalizedInsightsProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('insights.greeting.morning');
    if (hour < 18) return t('insights.greeting.afternoon');
    return t('insights.greeting.evening');
  };

  const insights = [
    {
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      title: 'Productivity Trend',
      value: focusMinutes > 0 ? `${Math.round(focusMinutes / 60)} hours` : 'Start tracking',
      description: 'Total focus time this week'
    },
    {
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
      title: 'Weekly Progress',
      value: `${Math.round((habitsCompleted / weeklyGoal) * 100)}%`,
      description: `${habitsCompleted}/${weeklyGoal} habits completed`
    },
    {
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600/10',
      title: 'Best Streak',
      value: `${longestStreak} days`,
      description: longestStreak > 0 ? 'Keep it going!' : 'Start your streak today'
    }
  ];

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="border-b border-border/40 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary/10">
        <CardTitle className={`text-lg font-bold tracking-tight flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sparkles className="w-5 h-5 text-purple-600" />
          {t('insights.title')}
        </CardTitle>
        <p className={`text-sm text-muted-foreground mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {getGreeting()}! 👋
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-accent/30 hover:bg-accent/50 transition-all duration-200 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-3 rounded-lg ${insight.bgColor}`}>
                <insight.icon className={`w-5 h-5 ${insight.color}`} />
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-xs font-medium text-muted-foreground">{insight.title}</p>
                <p className="text-xl font-bold mt-0.5">{insight.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};