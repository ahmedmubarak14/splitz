-- 1) Drop any existing triggers on subscription_contributors that call the recalc function on UPDATE
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'subscription_contributors'
      AND p.proname = 'trg_recalc_subscription_on_contributor_change'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.subscription_contributors;', trig.tgname);
  END LOOP;
END $$;

-- 2) Recreate the trigger WITHOUT UPDATE to avoid recursion
CREATE TRIGGER recalc_subscription_on_contributor_trigger
AFTER INSERT OR DELETE ON public.subscription_contributors
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_subscription_on_contributor_change();

-- 3) Recreate recalc_subscription_split WITHOUT session_replication_role (no superuser perms needed)
CREATE OR REPLACE FUNCTION public.recalc_subscription_split(_subscription_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;