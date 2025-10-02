import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Flame, Plus, Target, TrendingUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';

type Habit = {
  id: string;
  name: string;
  icon: string | null;
  streak_count: number | null;
  best_streak: number | null;
};

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🔥');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIcon, setEditIcon] = useState('🔥');
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  
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
        .select('id, name, icon, streak_count, best_streak, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Habit[] = ((data as Tables<'habits'>[] | null) ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        icon: (row as any).icon ?? null,
        streak_count: row.streak_count,
        best_streak: (row as any).best_streak ?? null,
      }));

      setHabits(mapped);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load habits';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabitTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload: TablesInsert<'habits'> = {
        user_id: user.id,
        name: newHabitTitle,
        icon: newHabitIcon,
      };
      const { error } = await supabase.from('habits').insert(payload);

      if (error) throw error;

      toast.success('Habit created! 🎉');
      setNewHabitTitle('');
      setNewHabitIcon('🔥');
      setDialogOpen(false);
      fetchHabits();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create habit';
      toast.error(message);
    }
  };

  const checkInHabit = async (habitId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('habit_check_ins').insert({
        habit_id: habitId,
        user_id: user.id,
      } as TablesInsert<'habit_check_ins'>);

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to check in';
      toast.error(message);
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setEditTitle(habit.name);
    setEditIcon(habit.icon || '🔥');
    setEditDialogOpen(true);
  };

  const updateHabit = async () => {
    if (!editingHabit || !editTitle.trim()) return;

    try {
      const payload: TablesUpdate<'habits'> = {
        name: editTitle.trim(),
        icon: editIcon,
      };

      const { error } = await supabase
        .from('habits')
        .update(payload)
        .eq('id', editingHabit.id);

      if (error) throw error;

      toast.success('Habit updated! ✓');
      setEditDialogOpen(false);
      setEditingHabit(null);
      fetchHabits();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update habit';
      toast.error(message);
    }
  };

  const openDeleteDialog = (habit: Habit) => {
    setDeletingHabit(habit);
    setDeleteDialogOpen(true);
  };

  const deleteHabit = async () => {
    if (!deletingHabit) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', deletingHabit.id);

      if (error) throw error;

      toast.success('Habit deleted');
      setDeleteDialogOpen(false);
      setDeletingHabit(null);
      fetchHabits();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete habit';
      toast.error(message);
    }
  };

  const emojiOptions = ['🔥', '💪', '🎯', '📚', '🏃', '🧘', '💧', '🌱', '⭐', '🎨'];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 p-6 animate-slide-up">
      <LanguageToggle />
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
                  {t('habits.title')}
                </h1>
                <p className="text-lg text-muted-foreground mt-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('habits.myHabits')}
                </p>
              </div>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                variant="gradient"
              >
                <Plus className="w-5 h-5" />
                {t('habits.createNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{t('habits.createNew')}</DialogTitle>
                <DialogDescription className="text-base">
                  Create a new habit to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                <div>
                  <label className="text-sm font-semibold mb-3 block">Choose an emoji</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewHabitIcon(emoji)}
                        className={`text-4xl p-3 rounded-xl transition-all hover:scale-110 ${
                          newHabitIcon === emoji 
                            ? 'bg-primary/10 scale-110 ring-2 ring-primary shadow-md' 
                            : 'bg-muted/50 hover:bg-muted'
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
                  className="h-12 text-base"
                />
                <Button 
                  onClick={createHabit} 
                  className="w-full h-12"
                  variant="gradient"
                >
                  {t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-primary">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Start Your Journey!</h3>
              <p className="text-lg text-muted-foreground max-w-md">
                {t('habits.noHabits')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <Card
                key={habit.id}
                className="card-hover"
              >
                <div className="h-1 gradient-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-5xl">{habit.icon || '🔥'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold">{habit.name}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-0">
                              <DropdownMenuItem onClick={() => openEditDialog(habit)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(habit)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Flame className="w-5 h-5 text-accent" />
                          <span className="font-bold text-xl text-accent">
                            {habit.streak_count ?? 0}
                          </span>
                          <span className="text-sm">{t('habits.days')}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl backdrop-blur-sm">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('habits.bestStreak')}
                    </span>
                    <span className="font-bold text-lg flex items-center gap-1">
                      <span className="text-primary">{habit.best_streak ?? 0}</span>
                      <span className="text-sm text-muted-foreground">{t('habits.days')}</span>
                    </span>
                  </div>
                  <Button
                    onClick={() => checkInHabit(habit.id)}
                    className="w-full"
                    variant="success"
                  >
                    {t('habits.checkIn')} ✓
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Habit</DialogTitle>
            <DialogDescription className="text-base">
              Update your habit details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <label className="text-sm font-semibold mb-3 block">Choose an emoji</label>
              <div className="flex gap-2 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditIcon(emoji)}
                    className={`text-4xl p-3 rounded-2xl transition-all hover:scale-110 ${
                      editIcon === emoji 
                        ? 'bg-primary/20 scale-110 ring-2 ring-primary' 
                        : 'bg-muted hover:bg-muted/70'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Habit name"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-12 text-base"
            />
            <div className="flex gap-2">
              <Button 
                onClick={updateHabit} 
                className="flex-1 h-12 text-base"
                variant="gradient"
              >
                Update Habit
              </Button>
              <Button 
                onClick={() => setEditDialogOpen(false)} 
                variant="outline"
                className="h-12"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingHabit?.name}"? This will also delete all check-in history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteHabit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Navigation />
    </div>
  );
};

export default Habits;
