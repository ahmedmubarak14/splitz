-- 1) Add payload column to invitations table
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

-- 2) Add payment workflow columns to subscription_contributors
ALTER TABLE public.subscription_contributors
ADD COLUMN IF NOT EXISTS payment_submitted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS submission_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

-- 3) Drop existing restrictive SELECT policies on subscription_contributors
DROP POLICY IF EXISTS "Contributors can view fellow contributors" ON public.subscription_contributors;
DROP POLICY IF EXISTS "Subscription owners can view all contributors" ON public.subscription_contributors;

-- 4) Create single permissive SELECT policy for subscription_contributors
CREATE POLICY "Owners and contributors can view contributors"
ON public.subscription_contributors
FOR SELECT
USING (
  is_subscription_owner(auth.uid(), subscription_id) 
  OR is_subscription_contributor(auth.uid(), subscription_id)
);

-- 5) Update contributor UPDATE policy to allow payment submission
DROP POLICY IF EXISTS "Contributors can update their payment status" ON public.subscription_contributors;

CREATE POLICY "Contributors can submit payment"
ON public.subscription_contributors
FOR UPDATE
USING (auth.uid() = user_id);

-- 6) Add owner UPDATE policy for approvals
CREATE POLICY "Owners can approve payments"
ON public.subscription_contributors
FOR UPDATE
USING (is_subscription_owner(auth.uid(), subscription_id));

-- 7) Create validation trigger to protect column-level security
CREATE OR REPLACE FUNCTION public.validate_subscription_contributor_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  -- Check if user is subscription owner
  is_owner := is_subscription_owner(auth.uid(), NEW.subscription_id);
  
  -- Contributors can only update their own payment_submitted, paid_at, submission_at
  IF NOT is_owner AND NEW.user_id = auth.uid() THEN
    -- Block changes to owner-only fields
    IF (OLD.is_settled IS DISTINCT FROM NEW.is_settled) OR 
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) THEN
      RAISE EXCEPTION 'Only subscription owner can approve payments';
    END IF;
  END IF;
  
  -- Owners can only update is_settled, approved_at
  IF is_owner AND NEW.user_id != auth.uid() THEN
    -- Block changes to contributor-only fields
    IF (OLD.payment_submitted IS DISTINCT FROM NEW.payment_submitted AND 
        NEW.payment_submitted = true) OR
       (OLD.submission_at IS DISTINCT FROM NEW.submission_at) THEN
      RAISE EXCEPTION 'Only contributors can submit payments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_contributor_update
BEFORE UPDATE ON public.subscription_contributors
FOR EACH ROW
EXECUTE FUNCTION public.validate_subscription_contributor_update();

-- 8) Notification trigger when contributor submits payment
CREATE OR REPLACE FUNCTION public.notify_payment_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sub_name TEXT;
  sub_owner_id UUID;
  contributor_name TEXT;
BEGIN
  -- Only trigger when payment_submitted changes from false to true
  IF OLD.payment_submitted = false AND NEW.payment_submitted = true THEN
    -- Get subscription details
    SELECT name, user_id INTO sub_name, sub_owner_id
    FROM public.subscriptions
    WHERE id = NEW.subscription_id;
    
    -- Get contributor name
    SELECT full_name INTO contributor_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Notify owner
    PERFORM create_notification(
      sub_owner_id,
      'Payment Submitted',
      contributor_name || ' submitted payment for "' || sub_name || '"',
      'subscription',
      NEW.subscription_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_payment_submission
AFTER UPDATE ON public.subscription_contributors
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_submitted();

-- 9) Notification trigger when owner approves/rejects payment
CREATE OR REPLACE FUNCTION public.notify_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sub_name TEXT;
  status_msg TEXT;
BEGIN
  -- Only trigger when is_settled changes
  IF OLD.is_settled IS DISTINCT FROM NEW.is_settled THEN
    -- Get subscription name
    SELECT name INTO sub_name
    FROM public.subscriptions
    WHERE id = NEW.subscription_id;
    
    IF NEW.is_settled = true THEN
      status_msg := 'Payment approved for "' || sub_name || '"';
    ELSE
      status_msg := 'Payment needs review for "' || sub_name || '"';
    END IF;
    
    -- Notify contributor
    PERFORM create_notification(
      NEW.user_id,
      'Payment Status',
      status_msg,
      'subscription',
      NEW.subscription_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_payment_approval
AFTER UPDATE ON public.subscription_contributors
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_status();