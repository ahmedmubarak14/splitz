import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp, MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIcon, setEditIcon] = useState('🔥');
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
    if (!session) navigate('/auth');
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
      toast.error(error instanceof Error ? error.message : 'Failed to load habits');
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

      toast.success('Habit created');
      setNewHabitTitle('');
      setNewHabitIcon('🔥');
      setDialogOpen(false);
      fetchHabits();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create habit');
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
          toast.error('Already checked in today');
        } else {
          throw error;
        }
      } else {
        toast.success('Checked in');
        fetchHabits();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to check in');
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

      toast.success('Habit updated');
      setEditDialogOpen(false);
      setEditingHabit(null);
      fetchHabits();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update habit');
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
      toast.error(error instanceof Error ? error.message : 'Failed to delete habit');
    }
  };

  const emojiOptions = ['🔥', '💪', '🎯', '📚', '🏃', '🧘', '💧', '🌱', '⭐', '🎨'];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 p-6">
      <LanguageToggle />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
              {t('habits.title')}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('habits.myHabits')}
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('habits.createNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('habits.createNew')}</DialogTitle>
                <DialogDescription>
                  Create a new habit to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Choose an emoji</label>
                  <div className="flex gap-2 flex-wrap">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewHabitIcon(emoji)}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          newHabitIcon === emoji 
                            ? 'bg-accent' 
                            : 'bg-muted hover:bg-accent'
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
                <Button onClick={createHabit} className="w-full">
                  {t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : habits.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Target className="w-16 h-16 text-muted mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start Your Journey</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('habits.noHabits')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <Card key={habit.id} className="border border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{habit.icon || '🔥'}</div>
                      <div>
                        <CardTitle className="text-base font-semibold">{habit.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {habit.streak_count ?? 0} day streak
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
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
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">Best Streak</span>
                    <span className="font-semibold">{habit.best_streak ?? 0} days</span>
                  </div>
                  <Button
                    onClick={() => checkInHabit(habit.id)}
                    className="w-full"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('habits.checkIn')}
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
            <DialogTitle>Edit Habit</DialogTitle>
            <DialogDescription>Update your habit details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Choose an emoji</label>
              <div className="flex gap-2 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditIcon(emoji)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      editIcon === emoji ? 'bg-accent' : 'bg-muted hover:bg-accent'
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
            />
            <div className="flex gap-2">
              <Button onClick={updateHabit} className="flex-1">
                Update Habit
              </Button>
              <Button onClick={() => setEditDialogOpen(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingHabit?.name}"? This action cannot be undone.
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
