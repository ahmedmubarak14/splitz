-- Align habits schema with UI needs: add icon and best_streak
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS best_streak INTEGER NOT NULL DEFAULT 0;

-- Create habit_check_ins table for daily check-ins
CREATE TABLE IF NOT EXISTS public.habit_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  checked_at DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure only one check-in per habit per user per day
CREATE UNIQUE INDEX IF NOT EXISTS habit_check_ins_unique_daily
  ON public.habit_check_ins (habit_id, user_id, checked_at);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS habit_check_ins_habit_id_idx ON public.habit_check_ins (habit_id);
CREATE INDEX IF NOT EXISTS habit_check_ins_user_id_idx ON public.habit_check_ins (user_id);

-- Enable RLS
ALTER TABLE public.habit_check_ins ENABLE ROW LEVEL SECURITY;

-- Policies: Only habit owners can view/insert/delete check-ins for their habits; users can update their own rows (not typical, but provided for completeness)
CREATE POLICY IF NOT EXISTS "Users can view their own habit check-ins"
  ON public.habit_check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_check_ins.habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create check-ins for their own habits"
  ON public.habit_check_ins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_check_ins.habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete their own habit check-ins"
  ON public.habit_check_ins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_check_ins.habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their own habit check-ins"
  ON public.habit_check_ins FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update streaks on check-in
CREATE OR REPLACE FUNCTION public.handle_habit_check_in()
RETURNS TRIGGER AS $$
DECLARE
  previous_last date;
  new_streak integer;
BEGIN
  SELECT h.last_completed_at::date INTO previous_last
  FROM public.habits h
  WHERE h.id = NEW.habit_id
  FOR UPDATE;

  IF previous_last IS NULL THEN
    new_streak := 1;
  ELSIF previous_last = (NEW.checked_at - INTERVAL '1 day')::date THEN
    -- consecutive day
    SELECT COALESCE(h.streak_count, 0) + 1 INTO new_streak FROM public.habits h WHERE h.id = NEW.habit_id;
  ELSIF previous_last = NEW.checked_at THEN
    -- same day (should be prevented by unique index), keep existing
    SELECT COALESCE(h.streak_count, 0) INTO new_streak FROM public.habits h WHERE h.id = NEW.habit_id;
  ELSE
    -- gap in streak
    new_streak := 1;
  END IF;

  UPDATE public.habits h
  SET
    last_completed_at = NEW.checked_at::timestamptz,
    streak_count = new_streak,
    best_streak = GREATEST(COALESCE(h.best_streak, 0), new_streak),
    updated_at = now()
  WHERE h.id = NEW.habit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS habit_check_ins_after_insert ON public.habit_check_ins;
CREATE TRIGGER habit_check_ins_after_insert
  AFTER INSERT ON public.habit_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_habit_check_in();

-- Profiles table to support profile page
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Auto-create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

