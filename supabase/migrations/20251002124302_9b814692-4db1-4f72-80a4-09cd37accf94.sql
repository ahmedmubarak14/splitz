-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  streak_count INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_members table
CREATE TABLE public.expense_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount_owed DECIMAL(10, 2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_participants table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Habits RLS Policies
CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses RLS Policies
CREATE POLICY "Users can view expenses they created or are members of"
  ON public.expenses FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.expense_members
      WHERE expense_members.expense_id = expenses.id
      AND expense_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Expense Members RLS Policies
CREATE POLICY "Users can view expense members for their expenses"
  ON public.expense_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_members.expense_id
      AND (expenses.user_id = auth.uid() OR expense_members.user_id = auth.uid())
    )
  );

CREATE POLICY "Expense creators can add members"
  ON public.expense_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_members.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense members can update their settlement status"
  ON public.expense_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Challenges RLS Policies
CREATE POLICY "Users can view challenges they created or participate in"
  ON public.challenges FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.challenge_participants
      WHERE challenge_participants.challenge_id = challenges.id
      AND challenge_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own challenges"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own challenges"
  ON public.challenges FOR DELETE
  USING (auth.uid() = creator_id);

-- Challenge Participants RLS Policies
CREATE POLICY "Users can view participants for their challenges"
  ON public.challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND (challenges.creator_id = auth.uid() OR challenge_participants.user_id = auth.uid())
    )
  );

CREATE POLICY "Challenge creators can add participants"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.creator_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own progress"
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();