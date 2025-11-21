-- Fix infinite recursion in recalc_subscription_split by disabling triggers during UPDATE
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
  
  -- Disable triggers to prevent recursion
  SET session_replication_role = replica;
  
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
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
END;
$function$;