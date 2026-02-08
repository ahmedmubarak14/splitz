import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface QuickAddTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProject?: string;
  defaultQuadrant?: string | null;
}

const QUADRANT_OPTIONS = [
  { id: 'urgent_important', emoji: '🔥', color: 'text-red-600' },
  { id: 'not_urgent_important', emoji: '⏰', color: 'text-orange-600' },
  { id: 'urgent_unimportant', emoji: '👥', color: 'text-blue-600' },
  { id: 'not_urgent_unimportant', emoji: '🗑️', color: 'text-green-600' },
];

const QuickAddTask = ({ open, onOpenChange, defaultProject = 'Inbox', defaultQuadrant = null }: QuickAddTaskProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState(defaultProject);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priorityQuadrant, setPriorityQuadrant] = useState<string | null>(defaultQuadrant);

  const addTask = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('focus_tasks')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          project,
          due_date: dueDate?.toISOString() || null,
          priority_quadrant: priorityQuadrant as any,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      toast.success(t('tasks.quickAdd.success'));
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t('tasks.quickAdd.failed'));
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setPriorityQuadrant(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('tasks.quickAdd.titleRequired'));
      return;
    }
    addTask.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tasks.quickAdd.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('tasks.quickAdd.taskTitleRequired')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tasks.quickAdd.taskTitlePlaceholder')}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">{t('tasks.quickAdd.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tasks.quickAdd.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="project">{t('tasks.quickAdd.project')}</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger id="project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inbox">{t('tasks.quickAdd.projects.inbox')}</SelectItem>
                  <SelectItem value="Work">{t('tasks.quickAdd.projects.work')}</SelectItem>
                  <SelectItem value="Personal">{t('tasks.quickAdd.projects.personal')}</SelectItem>
                  <SelectItem value="Learning">{t('tasks.quickAdd.projects.learning')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('tasks.quickAdd.dueDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'MMM d') : t('tasks.quickAdd.noDueDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Priority Quadrant Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Grid3X3 className="w-4 h-4" />
              {t('tasks.quickAdd.priorityQuadrant')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {QUADRANT_OPTIONS.map((q) => (
                <Button
                  key={q.id}
                  type="button"
                  variant={priorityQuadrant === q.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'justify-start text-xs h-9',
                    priorityQuadrant === q.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setPriorityQuadrant(priorityQuadrant === q.id ? null : q.id)}
                >
                  <span className="mr-1.5">{q.emoji}</span>
                  {t(`matrix.quadrants.${q.id}.title`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('tasks.quickAdd.cancel')}
            </Button>
            <Button type="submit" disabled={addTask.isPending}>
              {addTask.isPending ? t('tasks.quickAdd.adding') : t('tasks.quickAdd.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddTask;
