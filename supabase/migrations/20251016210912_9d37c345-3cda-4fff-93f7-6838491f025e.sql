-- Add daily reminder tracking columns to subscription_contributors
ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS daily_reminder_count INTEGER DEFAULT 0;

ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS reminder_count_reset_date DATE DEFAULT CURRENT_DATE;