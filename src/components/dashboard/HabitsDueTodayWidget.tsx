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
          <div className={`p-3 rounded-lg bg-muted/20 border border-border/30 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center justify-between mb-2 text-xs font-medium text-muted-foreground">
              <span>{t('dashboard.todaysProgress')}</span>
              <span className={`${completionPercentage === 100 ? 'text-success' : 'text-foreground'}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-success to-success/80 transition-all duration-700 ease-out shadow-sm"
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
                  className={`flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/40 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <button
                    onClick={() => handleCheckIn(habit.id)}
                    disabled={checking === habit.id}
                    className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 ring-success/20 rounded transition-all"
                  >
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-success transition-colors" />
                  </button>
                  <span className="text-2xl">{habit.icon}</span>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium leading-tight mb-1">{habit.name}</p>
                    <div className={`flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Flame className="h-3.5 w-3.5" />
                      <span className="font-medium">{habit.streak_count} {t('habits.dayStreak')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-lg bg-success/5 border border-success/20">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
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
            className={`w-full hover:bg-accent/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('dashboard.viewAll')}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <CheckCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-2">
            {t('dashboard.noHabits')}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
            Start building positive habits today
          </p>
          <Button 
            size="sm" 
            onClick={() => navigate('/habits')}
            className="shadow-sm hover:shadow-md transition-all"
          >
            {t('dashboard.createHabit')}
          </Button>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
