-- Part 1: Create function to auto-add subscription owner as contributor
CREATE OR REPLACE FUNCTION public.auto_add_subscription_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only add owner if subscription is shared
  IF NEW.is_shared = true THEN
    INSERT INTO public.subscription_contributors (
      subscription_id,
      user_id,
      contribution_amount,
      split_value
    ) VALUES (
      NEW.id,
      NEW.user_id,
      0, -- Will be recalculated by recalc_subscription_split
      NULL
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicate if already exists
    
    -- Trigger recalculation to properly split the amount
    PERFORM public.recalc_subscription_split(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Part 2: Create trigger to auto-add owner on subscription creation
CREATE TRIGGER add_owner_as_contributor
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  WHEN (NEW.is_shared = true)
  EXECUTE FUNCTION public.auto_add_subscription_owner();

-- Part 3: Backfill existing shared subscriptions that are missing the owner
DO $$
DECLARE
  sub_record RECORD;
BEGIN
  -- Find all shared subscriptions where the owner is not in contributors
  FOR sub_record IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    WHERE s.is_shared = true
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_contributors sc
        WHERE sc.subscription_id = s.id AND sc.user_id = s.user_id
      )
  LOOP
    -- Add the owner as a contributor
    INSERT INTO public.subscription_contributors (
      subscription_id,
      user_id,
      contribution_amount,
      split_value
    ) VALUES (
      sub_record.id,
      sub_record.user_id,
      0,
      NULL
    )
    ON CONFLICT DO NOTHING;
    
    -- Recalculate the split to divide properly among all contributors
    PERFORM public.recalc_subscription_split(sub_record.id);
  END LOOP;
END;
$$;