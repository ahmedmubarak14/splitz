import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Flame, Plus, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';

type Habit = {
  id: string;
  title: string;
  icon: string;
  current_streak: number;
  best_streak: number;
};

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🔥');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
    fetchHabits();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error: any) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabitTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        title: newHabitTitle,
        icon: newHabitIcon,
      });

      if (error) throw error;

      toast.success('Habit created! 🎉');
      setNewHabitTitle('');
      setNewHabitIcon('🔥');
      setDialogOpen(false);
      fetchHabits();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const checkInHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('habit_check_ins').insert({
        habit_id: habitId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already checked in today!');
        } else {
          throw error;
        }
      } else {
        toast.success('Streak updated! 🔥');
        fetchHabits();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const emojiOptions = ['🔥', '💪', '🎯', '📚', '🏃', '🧘', '💧', '🌱', '⭐', '🎨'];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <LanguageToggle />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('habits.title')} 🔥
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('habits.myHabits')}
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white shadow-primary hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 mr-2" />
                {t('habits.createNew')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('habits.createNew')}</DialogTitle>
                <DialogDescription>
                  Create a new habit to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Choose an emoji</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewHabitIcon(emoji)}
                        className={`text-3xl p-2 rounded-lg transition-all hover:scale-110 ${
                          newHabitIcon === emoji ? 'bg-primary/20 scale-110' : 'bg-muted'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  placeholder="Habit name (e.g., Morning workout)"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                />
                <Button onClick={createHabit} className="w-full gradient-primary text-white">
                  {t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('habits.noHabits')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {habits.map((habit) => (
              <Card
                key={habit.id}
                className="shadow-card hover:shadow-primary transition-all hover:scale-105 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{habit.icon}</div>
                      <div>
                        <CardTitle className="text-xl">{habit.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-orange-500">{habit.current_streak}</span>
                          {t('habits.days')}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('habits.bestStreak')}: <span className="font-bold">{habit.best_streak}</span> {t('habits.days')}
                    </div>
                    <Button
                      onClick={() => checkInHabit(habit.id)}
                      size="sm"
                      className="gradient-success text-white hover:scale-105 transition-transform"
                    >
                      {t('habits.checkIn')} ✓
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Habits;
