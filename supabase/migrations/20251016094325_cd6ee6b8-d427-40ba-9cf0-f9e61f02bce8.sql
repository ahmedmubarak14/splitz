-- ============================================
-- SUBSCRIPTIONS FEATURE
-- ============================================

-- Subscriptions table (personal and shared)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'SAR' NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'custom')),
  custom_cycle_days INTEGER CHECK (custom_cycle_days > 0),
  next_renewal_date DATE NOT NULL,
  category TEXT DEFAULT 'other',
  notes TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscription reminders
CREATE TABLE public.subscription_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  days_before INTEGER NOT NULL CHECK (days_before > 0),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscription payment history
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT
);

-- Shared subscription contributors
CREATE TABLE public.subscription_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contribution_amount NUMERIC NOT NULL CHECK (contribution_amount >= 0),
  is_settled BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(subscription_id, user_id)
);

-- ============================================
-- TASK SHARING FEATURE
-- ============================================

CREATE TABLE public.task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.focus_tasks(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TRIPS FEATURE
-- ============================================

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trip_id, user_id)
);

CREATE TABLE public.trip_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_group BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.trip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- RLS POLICIES - SUBSCRIPTIONS
-- ============================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_contributors ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared subscriptions they contribute to"
  ON public.subscriptions FOR SELECT
  USING (
    is_shared AND EXISTS (
      SELECT 1 FROM public.subscription_contributors
      WHERE subscription_id = subscriptions.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription reminders policies
CREATE POLICY "Users can view reminders for their subscriptions"
  ON public.subscription_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_reminders.subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for their subscriptions"
  ON public.subscription_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reminders for their subscriptions"
  ON public.subscription_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_reminders.subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reminders for their subscriptions"
  ON public.subscription_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_reminders.subscription_id AND user_id = auth.uid()
    )
  );

-- Subscription payments policies
CREATE POLICY "Users can view payments for their subscriptions"
  ON public.subscription_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_payments.subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their subscriptions"
  ON public.subscription_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_id AND user_id = auth.uid()
    )
  );

-- Subscription contributors policies
CREATE POLICY "Users can view contributors for their shared subscriptions"
  ON public.subscription_contributors FOR SELECT
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_contributors.subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Subscription owners can add contributors"
  ON public.subscription_contributors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_id AND user_id = auth.uid() AND is_shared = true
    )
  );

CREATE POLICY "Contributors can update their payment status"
  ON public.subscription_contributors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Subscription owners can remove contributors"
  ON public.subscription_contributors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = subscription_contributors.subscription_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - TASK SHARING
-- ============================================

ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task shares they sent or received"
  ON public.task_shares FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create task shares for their tasks"
  ON public.task_shares FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.focus_tasks
      WHERE id = task_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Receivers can update task share status"
  ON public.task_shares FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Senders can delete pending task shares"
  ON public.task_shares FOR DELETE
  USING (auth.uid() = sender_id AND status = 'pending');

-- ============================================
-- RLS POLICIES - TRIPS
-- ============================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check trip membership
CREATE OR REPLACE FUNCTION public.is_trip_member(_user_id UUID, _trip_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = _trip_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = _trip_id AND created_by = _user_id
  );
$$;

-- Trips policies
CREATE POLICY "Users can view trips they are members of"
  ON public.trips FOR SELECT
  USING (is_trip_member(auth.uid(), id));

CREATE POLICY "Users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Trip creators can update their trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Trip creators can delete their trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = created_by);

-- Trip members policies
CREATE POLICY "Users can view members of trips they belong to"
  ON public.trip_members FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip creators can add members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE id = trip_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Invited users can join trips"
  ON public.trip_members FOR INSERT
  WITH CHECK (can_join_via_invite(auth.uid(), trip_id, 'trip'));

CREATE POLICY "Trip members can leave"
  ON public.trip_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Trip creators can remove members"
  ON public.trip_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE id = trip_members.trip_id AND created_by = auth.uid()
    )
  );

-- Trip tasks policies
CREATE POLICY "Trip members can view tasks"
  ON public.trip_tasks FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can create tasks"
  ON public.trip_tasks FOR INSERT
  WITH CHECK (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Assigned users and creators can update tasks"
  ON public.trip_tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to OR
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE id = trip_tasks.trip_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Task creators and trip creators can delete tasks"
  ON public.trip_tasks FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE id = trip_tasks.trip_id AND created_by = auth.uid()
    )
  );

-- Trip comments policies
CREATE POLICY "Trip members can view comments"
  ON public.trip_comments FOR SELECT
  USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can create comments"
  ON public.trip_comments FOR INSERT
  WITH CHECK (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Users can delete their own comments"
  ON public.trip_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on trips
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on trip_tasks
CREATE TRIGGER update_trip_tasks_updated_at
  BEFORE UPDATE ON public.trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_renewal ON public.subscriptions(next_renewal_date);
CREATE INDEX idx_subscriptions_is_active ON public.subscriptions(is_active);

-- Subscription contributors indexes
CREATE INDEX idx_subscription_contributors_subscription ON public.subscription_contributors(subscription_id);
CREATE INDEX idx_subscription_contributors_user ON public.subscription_contributors(user_id);

-- Task shares indexes
CREATE INDEX idx_task_shares_sender ON public.task_shares(sender_id);
CREATE INDEX idx_task_shares_receiver ON public.task_shares(receiver_id);
CREATE INDEX idx_task_shares_status ON public.task_shares(status);

-- Trips indexes
CREATE INDEX idx_trips_created_by ON public.trips(created_by);
CREATE INDEX idx_trips_start_date ON public.trips(start_date);
CREATE INDEX idx_trips_status ON public.trips(status);

-- Trip members indexes
CREATE INDEX idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON public.trip_members(user_id);

-- Trip tasks indexes
CREATE INDEX idx_trip_tasks_trip ON public.trip_tasks(trip_id);
CREATE INDEX idx_trip_tasks_assigned ON public.trip_tasks(assigned_to);
CREATE INDEX idx_trip_tasks_status ON public.trip_tasks(status);