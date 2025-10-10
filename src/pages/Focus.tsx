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
import { useIsRTL } from '@/lib/rtl-utils';

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

  // Page visibility detection (leaving page = tree dies)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentSessionId && isSessionActive && !isPaused) {
        pauseSession();
        markSessionAsFailed(currentSessionId);
        toast.error('🍂 You left the page - your tree died!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentSessionId, isSessionActive, isPaused]);

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
      console.error('Error fetching tasks:', error);
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
      console.error('Error fetching sessions:', error);
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
      console.error('Error cleaning up orphaned sessions:', error);
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
      toast.error('Please enter a task title');
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
      toast.error('Failed to create task');
      console.error(error);
      return;
    }

    toast.success('Task created successfully');
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
      toast.error('Failed to update task');
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
      toast.error('Failed to start session');
      console.error(error);
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
  };

  const resumeSession = () => {
    setIsPaused(false);
    startTimer();
  };

  const skipSession = () => {
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
        console.error('Error completing session:', error);
        toast.error('Failed to save session');
      } else {
        if (treeSurvived) {
          toast.success('🌳 Your tree survived! Great focus!', {
            description: 'Session completed successfully',
            duration: 5000,
          });
        } else {
          toast.error('🍂 Your tree died. Try again!', {
            description: 'Session ended early',
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
    <div className={`min-h-screen p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('nav.focus') || 'Focus'}</h1>
            <p className="text-muted-foreground">Stay focused on what matters most</p>
          </div>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={newTask.has_reminder}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, has_reminder: !!checked })}
                  />
                  <Label>Set Reminder</Label>
                </div>
                {newTask.has_reminder && (
                  <div>
                    <Label>Reminder Time</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.reminder_time}
                      onChange={(e) => setNewTask({ ...newTask, reminder_time: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label>Repeat</Label>
                  <Select value={newTask.repeat_pattern || 'none'} onValueChange={(value) => setNewTask({ ...newTask, repeat_pattern: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="No repeat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pomodoro Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warning Banner */}
                {isSessionActive && (
                  <Alert className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      ⚠️ Stay focused! Leaving this page, switching tabs, or minimizing the browser will kill your tree 🌳
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
                    Work (25 min)
                  </Button>
                  <Button
                    variant={sessionType === 'short_break' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('short_break')}
                    disabled={isSessionActive}
                  >
                    Short Break (5 min)
                  </Button>
                  <Button
                    variant={sessionType === 'long_break' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('long_break')}
                    disabled={isSessionActive}
                  >
                    Long Break (15 min)
                  </Button>
                  <Button
                    variant={sessionType === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isSessionActive && setSessionType('custom')}
                    disabled={isSessionActive}
                  >
                    Custom
                  </Button>
                </div>

                {/* Custom Duration Input */}
                {sessionType === 'custom' && !isSessionActive && (
                  <div className="flex items-center gap-2">
                    <Label>Duration (minutes):</Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                      className="w-24"
                    />
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
                        Your tree is {Math.round(treeGrowth)}% grown
                      </p>
                    </div>
                  )}
                </div>

                {/* Task Selector */}
                {!isSessionActive && (
                  <div>
                    <Label>Select a task to focus on (optional)</Label>
                    <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="No task selected" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No task</SelectItem>
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
                <div className="flex gap-2 justify-center">
                  {!isSessionActive ? (
                    <Button onClick={startSession} size="lg">
                      <Play className="w-5 h-5 mr-2" />
                      Start Focus
                    </Button>
                  ) : (
                    <>
                      {!isPaused ? (
                        <Button onClick={pauseSession} variant="secondary" size="lg">
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button onClick={resumeSession} size="lg">
                          <Play className="w-5 h-5 mr-2" />
                          Resume
                        </Button>
                      )}
                      <Button onClick={skipSession} variant="outline" size="lg">
                        <SkipForward className="w-5 h-5 mr-2" />
                        Skip
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trees className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{survivedSessions.length}</div>
                  <div className="text-sm text-muted-foreground">Trees Planted 🌳</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold">{totalFocusTime}</div>
                  <div className="text-sm text-muted-foreground">Focus Minutes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Skull className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <div className="text-2xl font-bold">{failedSessions.length}</div>
                  <div className="text-sm text-muted-foreground">Trees Died 💀</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incompleteTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No active tasks. Create one to get started!
                  </p>
                ) : (
                  incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => toggleTaskComplete(task.id, task.is_completed)}
                        className="mt-0.5"
                      >
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{task.title}</div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.has_reminder && (
                            <span className="text-xs flex items-center gap-1 text-primary">
                              <Bell className="w-3 h-3" />
                            </span>
                          )}
                          {task.repeat_pattern && (
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
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
                  <CardTitle>Completed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-success/10"
                    >
                      <button onClick={() => toggleTaskComplete(task.id, task.is_completed)}>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </button>
                      <div className="flex-1 min-w-0">
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
    </div>
  );
};

export default Focus;
