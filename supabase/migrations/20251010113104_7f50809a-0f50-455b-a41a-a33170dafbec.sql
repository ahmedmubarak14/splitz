-- Create focus_tasks table for task management
CREATE TABLE public.focus_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  has_reminder BOOLEAN DEFAULT false,
  reminder_time TIMESTAMP WITH TIME ZONE,
  parent_task_id UUID REFERENCES public.focus_tasks(id) ON DELETE CASCADE,
  repeat_pattern TEXT, -- 'daily', 'weekly', 'monthly', null for no repeat
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create focus_sessions table for Pomodoro tracking
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.focus_tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 25,
  tree_survived BOOLEAN DEFAULT false,
  session_type TEXT DEFAULT 'work', -- 'work', 'short_break', 'long_break'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for focus_tasks
CREATE POLICY "Users can view their own tasks"
ON public.focus_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.focus_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.focus_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.focus_tasks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for focus_sessions
CREATE POLICY "Users can view their own sessions"
ON public.focus_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_focus_tasks_updated_at
BEFORE UPDATE ON public.focus_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();