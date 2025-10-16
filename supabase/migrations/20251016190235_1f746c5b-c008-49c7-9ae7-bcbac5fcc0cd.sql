-- Phase 1: Fix email search by adding email to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing emails from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Phase 2: Add split type functionality
CREATE TYPE public.subscription_split_type AS ENUM ('equal', 'percentage', 'custom', 'shares');

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS split_type subscription_split_type DEFAULT 'equal';

ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS split_value NUMERIC;

-- Phase 3: Add last reminder sent tracking
ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;

-- Create function to recalculate subscription splits
CREATE OR REPLACE FUNCTION public.recalc_subscription_split(_subscription_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_total NUMERIC;
  sub_split_type subscription_split_type;
  contributor_count INT;
  total_shares NUMERIC;
BEGIN
  -- Get subscription details
  SELECT amount, split_type INTO sub_total, sub_split_type
  FROM public.subscriptions
  WHERE id = _subscription_id;
  
  SELECT COUNT(*) INTO contributor_count
  FROM public.subscription_contributors
  WHERE subscription_id = _subscription_id;
  
  IF contributor_count IS NULL OR contributor_count = 0 THEN
    RETURN;
  END IF;
  
  -- Recalculate based on split type
  IF sub_split_type = 'equal' THEN
    UPDATE public.subscription_contributors
    SET contribution_amount = sub_total / contributor_count,
        split_value = NULL
    WHERE subscription_id = _subscription_id;
    
  ELSIF sub_split_type = 'percentage' THEN
    UPDATE public.subscription_contributors
    SET contribution_amount = sub_total * (COALESCE(split_value, 0) / 100)
    WHERE subscription_id = _subscription_id;
    
  ELSIF sub_split_type = 'custom' THEN
    UPDATE public.subscription_contributors
    SET contribution_amount = COALESCE(split_value, 0)
    WHERE subscription_id = _subscription_id;
    
  ELSIF sub_split_type = 'shares' THEN
    SELECT SUM(COALESCE(split_value, 1)) INTO total_shares
    FROM public.subscription_contributors
    WHERE subscription_id = _subscription_id;
    
    IF total_shares > 0 THEN
      UPDATE public.subscription_contributors
      SET contribution_amount = sub_total * (COALESCE(split_value, 1) / total_shares)
      WHERE subscription_id = _subscription_id;
    END IF;
  END IF;
END;
$$;

-- Trigger to recalculate splits when subscription amount changes
CREATE OR REPLACE FUNCTION public.trg_recalc_subscription_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.amount IS DISTINCT FROM NEW.amount) OR (OLD.split_type IS DISTINCT FROM NEW.split_type) THEN
    PERFORM public.recalc_subscription_split(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_subscription_split_trigger ON public.subscriptions;
CREATE TRIGGER recalc_subscription_split_trigger
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalc_subscription_on_update();

-- Trigger to recalculate when contributors change
CREATE OR REPLACE FUNCTION public.trg_recalc_subscription_on_contributor_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.recalc_subscription_split(NEW.subscription_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_subscription_split(OLD.subscription_id);
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS recalc_subscription_on_contributor_trigger ON public.subscription_contributors;
CREATE TRIGGER recalc_subscription_on_contributor_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subscription_contributors
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalc_subscription_on_contributor_change();

-- Notification trigger when contributor added
CREATE OR REPLACE FUNCTION public.notify_contributor_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_name TEXT;
  sub_amount NUMERIC;
  sub_currency TEXT;
BEGIN
  SELECT name, amount, currency INTO sub_name, sub_amount, sub_currency 
  FROM public.subscriptions 
  WHERE id = NEW.subscription_id;
  
  PERFORM create_notification(
    NEW.user_id,
    'Added to Subscription',
    'You were added to "' || sub_name || '" - Your share: ' || sub_currency || ' ' || NEW.contribution_amount,
    'subscription',
    NEW.subscription_id
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_contributor_added_trigger ON public.subscription_contributors;
CREATE TRIGGER notify_contributor_added_trigger
  AFTER INSERT ON public.subscription_contributors
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contributor_added();