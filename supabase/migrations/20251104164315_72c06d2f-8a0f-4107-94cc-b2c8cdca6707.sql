-- Create trip_task_comments table for task collaboration
CREATE TABLE IF NOT EXISTS public.trip_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.trip_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trip_task_comments_task ON trip_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_trip_task_comments_created ON trip_task_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.trip_task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Trip members can view task comments"
  ON public.trip_task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_tasks tt
      WHERE tt.id = trip_task_comments.task_id
        AND is_trip_member(auth.uid(), tt.trip_id)
    )
  );

CREATE POLICY "Trip members can create task comments"
  ON public.trip_task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trip_tasks tt
      WHERE tt.id = trip_task_comments.task_id
        AND is_trip_member(auth.uid(), tt.trip_id)
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.trip_task_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.trip_task_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create trip_activity table for activity feed
CREATE TABLE IF NOT EXISTS public.trip_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task_created', 'task_completed', 'task_updated', 'member_joined', 'expense_added', 'comment_added')),
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_activity_trip ON trip_activity(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_activity_created ON trip_activity(created_at DESC);

-- Enable RLS
ALTER TABLE public.trip_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity
CREATE POLICY "Trip members can view trip activity"
  ON public.trip_activity FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "System can insert trip activity"
  ON public.trip_activity FOR INSERT
  WITH CHECK (is_trip_member(auth.uid(), trip_id));

-- Create trip_budgets table
CREATE TABLE IF NOT EXISTS public.trip_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  category_budgets JSONB DEFAULT '{}'::jsonb,
  alert_threshold NUMERIC DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id)
);

-- Enable RLS
ALTER TABLE public.trip_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Trip members can view trip budget"
  ON public.trip_budgets FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip creators can manage budget"
  ON public.trip_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_budgets.trip_id
        AND t.created_by = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_trip_task_comments_updated_at
  BEFORE UPDATE ON public.trip_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_budgets_updated_at
  BEFORE UPDATE ON public.trip_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log trip activity
CREATE OR REPLACE FUNCTION public.log_trip_activity(
  p_trip_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.trip_activity (trip_id, user_id, activity_type, activity_data)
  VALUES (p_trip_id, p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Trigger to log task completion
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_trip_activity(
      NEW.trip_id,
      NEW.created_by,
      'task_created',
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'done' AND NEW.status = 'done' THEN
      PERFORM log_trip_activity(
        NEW.trip_id,
        auth.uid(),
        'task_completed',
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_task_activity_trigger
  AFTER INSERT OR UPDATE ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();

-- Trigger to log member joins
CREATE OR REPLACE FUNCTION public.log_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_trip_activity(
    NEW.trip_id,
    NEW.user_id,
    'member_joined',
    jsonb_build_object('member_id', NEW.user_id, 'role', NEW.role)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_member_join_trigger
  AFTER INSERT ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_member_join();