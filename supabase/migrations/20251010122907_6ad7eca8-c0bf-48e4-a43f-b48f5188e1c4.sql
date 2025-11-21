-- ============================================
-- PHASE 1: DATABASE SCHEMA ENHANCEMENTS
-- ============================================

-- 1. HABITS ENHANCEMENTS
-- Add category, reminders, and tags to habits table

CREATE TYPE habit_category AS ENUM ('health', 'productivity', 'fitness', 'learning', 'social', 'mindfulness', 'finance', 'other');

ALTER TABLE habits 
  ADD COLUMN category habit_category DEFAULT 'other',
  ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN reminder_time TIME,
  ADD COLUMN tags TEXT[];

-- 2. CHALLENGES ENHANCEMENTS
-- Add type, category, difficulty, and target value

CREATE TYPE challenge_type AS ENUM ('percentage', 'habit', 'metric', 'steps');
CREATE TYPE challenge_category AS ENUM ('fitness', 'learning', 'productivity', 'health', 'finance', 'social', 'other');
CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard');

ALTER TABLE challenges
  ADD COLUMN type challenge_type DEFAULT 'percentage',
  ADD COLUMN category challenge_category DEFAULT 'other',
  ADD COLUMN difficulty challenge_difficulty DEFAULT 'medium',
  ADD COLUMN target_value INTEGER,
  ADD COLUMN current_value INTEGER DEFAULT 0;

-- 3. EXPENSES ENHANCEMENTS
-- Add receipt uploads and recurring expenses

ALTER TABLE expenses
  ADD COLUMN receipt_url TEXT,
  ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN recurrence_pattern TEXT,
  ADD COLUMN recurrence_end_date DATE;

-- 4. FOCUS SESSIONS ENHANCEMENTS
-- Add Pomodoro round tracking

ALTER TABLE focus_sessions
  ADD COLUMN round_number INTEGER DEFAULT 1,
  ADD COLUMN is_break BOOLEAN DEFAULT FALSE;

ALTER TABLE focus_tasks
  ADD COLUMN estimated_pomodoros INTEGER,
  ADD COLUMN completed_pomodoros INTEGER DEFAULT 0;

-- 5. CREATE STORAGE BUCKET FOR RECEIPTS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for receipts bucket
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Group members can view receipts from group expenses
CREATE POLICY "Group members can view expense receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.receipt_url = storage.objects.name
    AND is_group_member(auth.uid(), e.group_id)
  )
);