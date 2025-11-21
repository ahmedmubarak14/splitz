-- Create user_activity table to track engagement
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- Create email_log table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own email log"
  ON public.email_log FOR SELECT
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_email_log_user_id ON public.email_log(user_id);
CREATE INDEX idx_email_log_sent_at ON public.email_log(sent_at DESC);

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.user_activity (user_id, activity_type, activity_data)
  VALUES (p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Function to check if user needs re-engagement email
CREATE OR REPLACE FUNCTION public.get_inactive_users(days_inactive INTEGER)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    MAX(ua.created_at) as last_activity_at
  FROM profiles p
  LEFT JOIN user_activity ua ON ua.user_id = p.id
  WHERE p.created_at < now() - (days_inactive || ' days')::interval
  GROUP BY p.id, p.email, p.full_name
  HAVING MAX(ua.created_at) IS NULL OR MAX(ua.created_at) < now() - (days_inactive || ' days')::interval
  ORDER BY last_activity_at DESC NULLS FIRST;
$$;

-- Function to get user weekly summary
CREATE OR REPLACE FUNCTION public.get_user_weekly_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary JSONB;
  v_habits_completed INTEGER;
  v_focus_minutes INTEGER;
  v_challenges_progress INTEGER;
  v_expenses_added INTEGER;
BEGIN
  -- Get habits completed this week
  SELECT COUNT(*) INTO v_habits_completed
  FROM habit_check_ins
  WHERE user_id = p_user_id
    AND checked_in_at > now() - interval '7 days';
  
  -- Get focus time this week
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_focus_minutes
  FROM focus_sessions
  WHERE user_id = p_user_id
    AND created_at > now() - interval '7 days';
  
  -- Get challenge progress
  SELECT COUNT(*) INTO v_challenges_progress
  FROM challenge_participants cp
  JOIN challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.joined_at > now() - interval '7 days';
  
  -- Get expenses added
  SELECT COUNT(*) INTO v_expenses_added
  FROM expenses
  WHERE user_id = p_user_id
    AND created_at > now() - interval '7 days';
  
  v_summary := jsonb_build_object(
    'habits_completed', v_habits_completed,
    'focus_minutes', v_focus_minutes,
    'challenges_progress', v_challenges_progress,
    'expenses_added', v_expenses_added
  );
  
  RETURN v_summary;
END;
$$;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;