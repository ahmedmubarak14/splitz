-- Add trial tracking and price history fields to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at DATE,
ADD COLUMN IF NOT EXISTS original_price NUMERIC,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create subscription_price_history table for tracking price changes
CREATE TABLE IF NOT EXISTS public.subscription_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on price_history table
ALTER TABLE public.subscription_price_history ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view price history for their subscriptions
CREATE POLICY "Users can view price history for their subscriptions"
  ON public.subscription_price_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.id = subscription_price_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

-- RLS policy: System can insert price history
CREATE POLICY "System can insert price history"
  ON public.subscription_price_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.id = subscription_price_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id 
  ON public.subscription_price_history(subscription_id);

-- Add updated_at trigger to price_history
CREATE TRIGGER update_subscription_price_history_updated_at
  BEFORE UPDATE ON public.subscription_price_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();