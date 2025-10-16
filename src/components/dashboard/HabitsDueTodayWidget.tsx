import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle, ArrowRight, Flame } from 'lucide-react';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsRTL } from '@/lib/rtl-utils';
import { Button } from '@/components/ui/button';

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak_count: number;
  best_streak: number;
  hasCheckedInToday: boolean;
}

interface HabitsDueTodayWidgetProps {
  habits: Habit[];
  onRefresh: () => void;
}

export function HabitsDueTodayWidget({ habits, onRefresh }: HabitsDueTodayWidgetProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [checking, setChecking] = useState<string | null>(null);

  const handleCheckIn = async (habitId: string) => {
    setChecking(habitId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('habit_check_ins')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          checked_in_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success(t('habits.checkedIn') || 'Habit checked in! 🎉');
      onRefresh();
    } catch (error) {
      console.error('Error checking in habit:', error);
      toast.error(t('errors.failedToUpdate'));
    } finally {
      setChecking(null);
    }
  };

  const uncheckedHabits = habits.filter(h => !h.hasCheckedInToday);
  const completionPercentage = habits.length > 0 
    ? Math.round((habits.filter(h => h.hasCheckedInToday).length / habits.length) * 100)
    : 0;

  return (
    <DashboardWidgetCard 
      title={t('dashboard.habitsToday')}
      icon={CheckCircle}
      badge={uncheckedHabits.length}
    >
      {habits.length > 0 ? (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground">
              <span>{t('dashboard.todaysProgress')}</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Unchecked Habits */}
          {uncheckedHabits.length > 0 ? (
            <div className="space-y-2">
              {uncheckedHabits.slice(0, 4).map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <button
                    onClick={() => handleCheckIn(habit.id)}
                    disabled={checking === habit.id}
                    className="flex-shrink-0"
                  >
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-success transition-colors" />
                  </button>
                  <span className="text-xl">{habit.icon}</span>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium">{habit.name}</p>
                    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Flame className="h-3 w-3" />
                      <span>{habit.streak_count} {t('habits.dayStreak')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-success mb-1">
                {t('dashboard.allHabitsComplete')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.keepItUp')}
              </p>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/habits')}
            className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className={`text-center py-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-muted-foreground mb-2">
            {t('dashboard.noHabits')}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/habits')}
          >
            {t('dashboard.createHabit')}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
