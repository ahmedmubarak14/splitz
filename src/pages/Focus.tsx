import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Play, Pause, SkipForward, Plus, Calendar, Bell, 
  Repeat, StickyNote, CheckCircle2, Circle, Clock,
  BarChart3, Trees, Sparkles, AlertTriangle, Skull
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsRTL } from '@/lib/rtl-utils';
import Navigation from '@/components/Navigation';
import { EmptyState } from '@/components/EmptyState';

interface FocusTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  has_reminder: boolean;
  reminder_time: string | null;
  parent_task_id: string | null;
  repeat_pattern: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface FocusSession {
  id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  tree_survived: boolean;
  session_type: string;
}

const Focus = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [sessionType, setSessionType] = useState<'work' | 'short_break' | 'long_break' | 'custom'>('work');
  const [customDuration, setCustomDuration] = useState(25);
  const [treeGrowth, setTreeGrowth] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const [visibilityGraceTimer, setVisibilityGraceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    has_reminder: false,
    reminder_time: '',
    repeat_pattern: '',
  });

  useEffect(() => {
    fetchUser();
    fetchTasks();
    fetchSessions();
    cleanupOrphanedSessions();
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (currentSessionId && isSessionActive) {
        markSessionAsFailed(currentSessionId);
      }
    };
  }, [currentSessionId, isSessionActive]);

  // Page visibility detection with grace period
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Tab/app is hidden
      if (document.hidden && currentSessionId && isSessionActive) {
        // CASE 1: Already paused - Don't kill tree, just track it
        if (isPaused) {
          console.log('Session paused, tab switched - tree safe');
          return; // Don't kill tree if already paused
        }
        
        // CASE 2: Running - Auto-pause and start grace period
        pauseSession();
        
        toast.warning('Focus session paused', {
          description: 'Return within 30 seconds to continue your session',
          duration: 5000,
        });
        
        // Start 30-second grace period
        const graceTimer = setTimeout(() => {
          markSessionAsFailed(currentSessionId);
          toast.error('Tree died - You were away too long');
        }, 30000); // 30 seconds
        
        setVisibilityGraceTimer(graceTimer);
      }
      
      // Tab/app is visible again
      if (!document.hidden && visibilityGraceTimer) {
        // User came back within grace period - cancel tree death
        clearTimeout(visibilityGraceTimer);
        setVisibilityGraceTimer(null);
        
        toast.success('Welcome back!', {
          description: 'Session is paused. Click Resume to continue.',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityGraceTimer) {
        clearTimeout(visibilityGraceTimer);
      }
    };
  }, [currentSessionId, isSessionActive, isPaused, visibilityGraceTimer]);

  // Browser close/refresh detection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentSessionId && isSessionActive) {
        markSessionAsFailed(currentSessionId);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSessionId, isSessionActive]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('focus_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch tasks');
      return;
    }

    setTasks(data || []);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .not('end_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Failed to fetch sessions');
      return;
    }

    setSessions(data || []);
  };

  const cleanupOrphanedSessions = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('focus_sessions')
      .update({ 
        end_time: new Date().toISOString(),
        tree_survived: false 
      })
      .is('end_time', null)
      .eq('user_id', user?.id);

    if (error) {
      toast.error('Failed to cleanup sessions');
    }
  };

  const markSessionAsFailed = async (sessionId: string) => {
    await supabase
      .from('focus_sessions')
      .update({
        end_time: new Date().toISOString(),
        tree_survived: false,
      })
      .eq('id', sessionId);
  };

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast.error(t('focus.taskTitleRequired'));
      return;
    }

    const { error } = await supabase
      .from('focus_tasks')
      .insert([{
        ...newTask,
        user_id: user?.id,
        due_date: newTask.due_date || null,
        reminder_time: newTask.has_reminder && newTask.reminder_time ? newTask.reminder_time : null,
        repeat_pattern: newTask.repeat_pattern || null,
      }]);

    if (error) {
      toast.error(t('focus.taskFailed'));
      return;
    }

    toast.success(t('focus.taskCreated'));
    setIsAddTaskOpen(false);
    setNewTask({
      title: '',
      description: '',
      due_date: '',
      has_reminder: false,
      reminder_time: '',
      repeat_pattern: '',
    });
    fetchTasks();
  };

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('focus_tasks')
      .update({ 
        is_completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', taskId);

    if (error) {
      toast.error(t('focus.taskFailed'));
      return;
    }

    fetchTasks();
  };

  const startSession = async () => {
    if (!user) return;

    const duration = sessionType === 'work' ? 25 : 
                    sessionType === 'short_break' ? 5 : 
                    sessionType === 'long_break' ? 15 : 
                    customDuration;
    setTimeLeft(duration * 60);

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([{
        user_id: user.id,
        task_id: selectedTask,
        duration_minutes: duration,
        session_type: sessionType,
        start_time: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      toast.error(t('focus.sessionStartFailed'));
      return;
    }

    setCurrentSessionId(data.id);
    setIsSessionActive(true);
    setIsPaused(false);
    setTreeGrowth(0);
    startTimer();
  };

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          completeSession(true);
          return 0;
        }
        
        // Grow tree as time passes (for work and custom sessions)
        if (sessionType === 'work' || sessionType === 'custom') {
          const duration = sessionType === 'work' ? 25 * 60 : customDuration * 60;
          const progress = ((duration - prev) / duration) * 100;
          setTreeGrowth(progress);
        }
        
        return prev - 1;
      });
    }, 1000);
  };

  const pauseSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
    setPausedAt(new Date());
  };

  const resumeSession = () => {
    if (pausedAt) {
      const pausedDuration = (new Date().getTime() - pausedAt.getTime()) / 1000;
      setTotalPausedTime(prev => prev + pausedDuration);
    }
    setPausedAt(null);
    setIsPaused(false);
    startTimer();
  };

  const skipSession = () => {
    setShowSkipConfirmation(true);
  };

  const confirmSkipSession = () => {
    setShowSkipConfirmation(false);
    completeSession(false);
  };

  const completeSession = async (treeSurvived: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (currentSessionId) {
      const { error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          tree_survived: treeSurvived,
        })
        .eq('id', currentSessionId);

      if (error) {
        toast.error(t('focus.sessionSaveFailed'));
      } else {
        if (treeSurvived) {
          toast.success(t('focus.treeSurvived'), {
            description: t('focus.sessionCompleted'),
            duration: 5000,
          });
        } else {
          toast.error(t('focus.treeDied'), {
            description: t('focus.sessionEndedEarly'),
            duration: 3000,
          });
        }
        fetchSessions();
      }
    }

    setIsSessionActive(false);
    setCurrentSessionId(null);
    setTreeGrowth(0);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const incompleteTasks = tasks.filter(t => !t.is_completed && !t.parent_task_id);
  const completedTasks = tasks.filter(t => t.is_completed);
  
  // Only count completed sessions (with end_time)
  const completedSessions = sessions.filter(s => s.end_time !== null);
  const survivedSessions = completedSessions.filter(s => s.tree_survived);
  const failedSessions = completedSessions.filter(s => !s.tree_survived);
  const totalFocusTime = survivedSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className={`min-h-screen p-4 md:p-6 pb-24 md:pb-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('focus.title')}</h1>
            <p className="text-sm md:text-base text-muted-foreground">{t('focus.subtitle')}</p>
          </div>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('focus.addTask')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('focus.createNewTask')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('focus.taskTitle')}</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder={t('focus.taskTitlePlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                <div>
                  <Label>{t('focus.description')}</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder={t('focus.descriptionPlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                <div>
                  <Label>{t('focus.dueDate')}</Label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Checkbox
                    checked={newTask.has_reminder}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, has_reminder: !!checked })}
                  />
                  <Label>{t('focus.setReminder')}</Label>
                </div>
                {newTask.has_reminder && (
                  <div>
                    <Label>{t('focus.reminderTime')}</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.reminder_time}
                      onChange={(e) => setNewTask({ ...newTask, reminder_time: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label>{t('focus.repeat')}</Label>
                  <Select value={newTask.repeat_pattern || 'none'} onValueChange={(value) => setNewTask({ ...newTask, repeat_pattern: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('focus.noRepeat')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('focus.noRepeat')}</SelectItem>
                      <SelectItem value="daily">{t('focus.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('focus.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('focus.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} className="w-full">{t('focus.createTask')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-5 h-5" />
                  {t('focus.pomodoroTimer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warning Banner */}
                {isSessionActive && (
                  <Alert className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className={`text-sm ${isRTL ? 'text-right' : ''}`}>
                      {t('focus.warningStayFocused')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Session Type Selector */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={sessionType === 'work' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('work')}
                    disabled={isSessionActive}
                  >
                    {t('focus.workSession')}
                  </Button>
                  <Button
                    variant={sessionType === 'short_break' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('short_break')}
                    disabled={isSessionActive}
                  >
                    {t('focus.shortBreak')}
                  </Button>
                  <Button
                    variant={sessionType === 'long_break' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('long_break')}
                    disabled={isSessionActive}
                  >
                    {t('focus.longBreak')}
                  </Button>
                  <Button
                    variant={sessionType === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('custom')}
                    disabled={isSessionActive}
                  >
                    {t('focus.custom')}
                  </Button>
                </div>

                {/* Custom Duration Input */}
                {sessionType === 'custom' && !isSessionActive && (
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label>{t('focus.durationMinutes')}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                      className="w-24"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Session Status Indicator */}
                {isSessionActive && (
                  <div className="text-center mb-4">
                    {isPaused ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                        <Pause className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                          Session Paused - Tree is Safe
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <Play className="w-4 h-4 text-green-600 animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Session Active - Stay Focused!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timer Display */}
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-primary mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  
                  {/* Tree Growth */}
                  {isSessionActive && (sessionType === 'work' || sessionType === 'custom') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Trees className="w-8 h-8 text-green-600" style={{ opacity: Math.max(0.3, treeGrowth / 100) }} />
                        <Sparkles className="w-4 h-4 text-yellow-500" style={{ opacity: treeGrowth / 100 }} />
                      </div>
                      <Progress value={treeGrowth} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('focus.treeGrowth', { percent: Math.round(treeGrowth) })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Task Selector */}
                {!isSessionActive && (
                  <div>
                    <Label>{t('focus.selectTask')}</Label>
                    <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('focus.noTaskSelected')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('focus.noTask')}</SelectItem>
                        {incompleteTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {!isSessionActive ? (
                    <Button onClick={startSession} size="lg">
                      <Play className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('focus.startFocus')}
                    </Button>
                  ) : (
                    <>
                      {!isPaused ? (
                        <Button 
                          onClick={pauseSession} 
                          variant="secondary" 
                          size="lg"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white dark:text-white"
                        >
                          <Pause className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {t('focus.pause')}
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2 items-center">
                          <Button onClick={resumeSession} size="lg" className="bg-green-600 hover:bg-green-700">
                            <Play className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('focus.resume')}
                          </Button>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                            ⏸️ Tree is safe while paused
                          </div>
                        </div>
                      )}
                      <Button onClick={skipSession} variant="destructive" size="lg">
                        <Skull className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        Give Up
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Skip Confirmation Dialog */}
                <AlertDialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Give Up Session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        If you end this session early, your tree will die. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continue Session</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmSkipSession} className="bg-destructive hover:bg-destructive/90">
                        End Session (Tree Dies)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4">
              <Card>
                <CardContent className="pt-4 md:pt-6 text-center">
                  <Trees className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-xl md:text-2xl font-bold">{survivedSessions.length}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('focus.treesPlanted')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 md:pt-6 text-center">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-success" />
                  <div className="text-xl md:text-2xl font-bold">{totalFocusTime}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('focus.focusMinutes')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 md:pt-6 text-center">
                  <Skull className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-destructive" />
                  <div className="text-xl md:text-2xl font-bold">{failedSessions.length}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('focus.treesDied')}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('focus.activeTasks')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incompleteTasks.length === 0 ? (
                  <div className="py-8">
                    <EmptyState
                      icon={StickyNote}
                      title={t('focus.noActiveTasks')}
                      description={t('focus.createTaskToStart')}
                      actionLabel={t('focus.addTask')}
                      onAction={() => setIsAddTaskOpen(true)}
                    />
                  </div>
                ) : (
                  incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <button
                        onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                        className="mt-0.5"
                      >
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                        <div className="font-medium text-sm">{task.title}</div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                        <div className={`flex gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {task.due_date && (
                            <span className={`text-xs flex items-center gap-1 text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                            </span>
                          )}
                          {task.has_reminder && (
                            <span className={`text-xs flex items-center gap-1 text-primary ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Bell className="w-3 h-3" />
                            </span>
                          )}
                          {task.repeat_pattern && (
                            <span className={`text-xs flex items-center gap-1 text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Repeat className="w-3 h-3" />
                              {task.repeat_pattern}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {completedTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('focus.completed')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 p-2 rounded-lg bg-success/10 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <button onClick={() => toggleTaskComplete(task.id, task.is_completed)}>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </button>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                        <div className="font-medium text-sm line-through text-muted-foreground">
                          {task.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Focus;
