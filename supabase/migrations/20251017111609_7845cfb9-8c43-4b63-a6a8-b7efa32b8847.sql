-- Week 1-4: Comprehensive Subscription Management Database Setup

-- Add new columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS usage_frequency text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS cancellation_notes text,
ADD COLUMN IF NOT EXISTS cancellation_url text,
ADD COLUMN IF NOT EXISTS last_price_check timestamptz DEFAULT now();

-- Add payment tracking columns to subscription_contributors
ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;

-- Create subscription spending history table
CREATE TABLE IF NOT EXISTS public.subscription_spending_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  total_spending numeric NOT NULL,
  category_breakdown jsonb DEFAULT '{}'::jsonb,
  subscription_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS on spending history
ALTER TABLE public.subscription_spending_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spending history"
ON public.subscription_spending_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending history"
ON public.subscription_spending_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create subscription templates table
CREATE TABLE IF NOT EXISTS public.subscription_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  logo_url text,
  typical_price numeric,
  typical_currency text DEFAULT 'SAR',
  billing_cycles text[] DEFAULT ARRAY['monthly'],
  cancellation_url text,
  cancellation_steps text,
  popularity_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Templates are public readable
ALTER TABLE public.subscription_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription templates"
ON public.subscription_templates FOR SELECT
USING (true);

-- Create subscription budgets table
CREATE TABLE IF NOT EXISTS public.subscription_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_limit numeric NOT NULL,
  category_limits jsonb DEFAULT '{}'::jsonb,
  alert_threshold numeric DEFAULT 0.8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscription_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets"
ON public.subscription_budgets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create subscription documents table (receipts, contracts)
CREATE TABLE IF NOT EXISTS public.subscription_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  document_type text NOT NULL, -- 'receipt', 'contract', 'confirmation', 'other'
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  uploaded_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.subscription_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents for their subscriptions"
ON public.subscription_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE id = subscription_documents.subscription_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE id = subscription_documents.subscription_id 
    AND user_id = auth.uid()
  )
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.subscription_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  used_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE public.subscription_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log usage for their subscriptions"
ON public.subscription_usage_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE id = subscription_usage_logs.subscription_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE id = subscription_usage_logs.subscription_id 
    AND user_id = auth.uid()
  )
);

-- Create index for faster usage queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_subscription 
ON public.subscription_usage_logs(subscription_id, used_at DESC);

-- Create index for spending history
CREATE INDEX IF NOT EXISTS idx_spending_history_user_month 
ON public.subscription_spending_history(user_id, month DESC);

-- Insert popular subscription templates
INSERT INTO public.subscription_templates (name, category, logo_url, typical_price, typical_currency, billing_cycles, cancellation_url, popularity_score) VALUES
('Netflix', 'entertainment', 'https://logo.clearbit.com/netflix.com', 63.99, 'SAR', ARRAY['monthly'], 'https://www.netflix.com/cancelplan', 100),
('Spotify', 'entertainment', 'https://logo.clearbit.com/spotify.com', 19.99, 'SAR', ARRAY['monthly'], 'https://www.spotify.com/account/subscription/', 95),
('YouTube Premium', 'entertainment', 'https://logo.clearbit.com/youtube.com', 23.99, 'SAR', ARRAY['monthly'], 'https://www.youtube.com/paid_memberships', 90),
('Amazon Prime', 'shopping', 'https://logo.clearbit.com/amazon.sa', 16, 'SAR', ARRAY['monthly', 'yearly'], 'https://www.amazon.sa/gp/primecentral', 85),
('Apple Music', 'entertainment', 'https://logo.clearbit.com/apple.com', 19.99, 'SAR', ARRAY['monthly'], 'https://music.apple.com/account/subscriptions', 80),
('iCloud Storage', 'productivity', 'https://logo.clearbit.com/icloud.com', 3.99, 'SAR', ARRAY['monthly'], 'https://www.icloud.com/settings/', 75),
('Google One', 'productivity', 'https://logo.clearbit.com/google.com', 8.49, 'SAR', ARRAY['monthly'], 'https://one.google.com/settings', 70),
('Microsoft 365', 'productivity', 'https://logo.clearbit.com/microsoft.com', 29, 'SAR', ARRAY['monthly', 'yearly'], 'https://account.microsoft.com/services/', 65),
('Adobe Creative Cloud', 'productivity', 'https://logo.clearbit.com/adobe.com', 239, 'SAR', ARRAY['monthly'], 'https://account.adobe.com/plans', 60),
('Disney+', 'entertainment', 'https://logo.clearbit.com/disneyplus.com', 29.99, 'SAR', ARRAY['monthly'], 'https://www.disneyplus.com/account', 55),
('ChatGPT Plus', 'productivity', 'https://logo.clearbit.com/openai.com', 80, 'SAR', ARRAY['monthly'], 'https://chat.openai.com/settings', 50),
('GitHub Pro', 'productivity', 'https://logo.clearbit.com/github.com', 15, 'SAR', ARRAY['monthly'], 'https://github.com/settings/billing', 45)
ON CONFLICT DO NOTHING;

-- Function to track price changes
CREATE OR REPLACE FUNCTION public.track_subscription_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    INSERT INTO public.subscription_price_history (subscription_id, old_price, new_price, changed_at)
    VALUES (NEW.id, OLD.amount, NEW.amount, now());
    
    -- Notify user of price change
    PERFORM create_notification(
      NEW.user_id,
      'Price Change Alert',
      NEW.name || ' price changed from ' || OLD.currency || ' ' || OLD.amount || ' to ' || NEW.currency || ' ' || NEW.amount,
      'subscription',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_price_changes ON public.subscriptions;
CREATE TRIGGER track_price_changes
AFTER UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.track_subscription_price_change();

-- Function to update usage frequency
CREATE OR REPLACE FUNCTION public.update_subscription_usage_frequency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_count integer;
  days_since_created integer;
  frequency text;
BEGIN
  -- Count usage in last 30 days
  SELECT COUNT(*) INTO usage_count
  FROM public.subscription_usage_logs
  WHERE subscription_id = NEW.subscription_id
  AND used_at > now() - interval '30 days';
  
  -- Determine frequency
  IF usage_count >= 20 THEN
    frequency := 'daily';
  ELSIF usage_count >= 8 THEN
    frequency := 'weekly';
  ELSIF usage_count >= 2 THEN
    frequency := 'monthly';
  ELSE
    frequency := 'rarely';
  END IF;
  
  -- Update subscription
  UPDATE public.subscriptions
  SET usage_frequency = frequency,
      last_used_at = NEW.used_at
  WHERE id = NEW.subscription_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_usage_frequency ON public.subscription_usage_logs;
CREATE TRIGGER update_usage_frequency
AFTER INSERT ON public.subscription_usage_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_usage_frequency();