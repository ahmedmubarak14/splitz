-- Add payment tracking to expense members
ALTER TABLE expense_members 
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

-- Create payment confirmations table
CREATE TABLE payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_member_id UUID REFERENCES expense_members(id) ON DELETE CASCADE,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount NUMERIC NOT NULL,
  notes TEXT
);

-- Enable RLS on payment_confirmations
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment confirmations
CREATE POLICY "Users can view payment confirmations in their groups"
ON payment_confirmations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expense_members em
    JOIN expenses e ON em.expense_id = e.id
    WHERE em.id = payment_confirmations.expense_member_id
    AND is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Users can create payment confirmations"
ON payment_confirmations FOR INSERT
WITH CHECK (auth.uid() = confirmed_by);

-- Add expense categories
CREATE TYPE expense_category AS ENUM (
  'food', 'transport', 'entertainment', 'utilities', 
  'shopping', 'health', 'education', 'other'
);

ALTER TABLE expenses 
ADD COLUMN category expense_category DEFAULT 'other';

-- Create challenge progress history table
CREATE TABLE challenge_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_history ON challenge_progress_history(challenge_id, user_id);

-- Enable RLS on challenge_progress_history
ALTER TABLE challenge_progress_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for progress history
CREATE POLICY "Users can view progress history for challenges they're in"
ON challenge_progress_history FOR SELECT
USING (is_challenge_member(auth.uid(), challenge_id));

CREATE POLICY "Users can insert their own progress history"
ON challenge_progress_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add habit goals
ALTER TABLE habits 
ADD COLUMN target_days INTEGER DEFAULT 30,
ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE;