-- Fix the trigger function to properly get group_id from the expenses table
CREATE OR REPLACE FUNCTION public.trg_recalc_net_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _group_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Get group_id from the related expense
    SELECT group_id INTO _group_id
    FROM public.expenses
    WHERE id = NEW.expense_id;
    
    IF _group_id IS NOT NULL THEN
      PERFORM public.recalc_net_balances(_group_id);
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Get group_id from the related expense
    SELECT group_id INTO _group_id
    FROM public.expenses
    WHERE id = OLD.expense_id;
    
    IF _group_id IS NOT NULL THEN
      PERFORM public.recalc_net_balances(_group_id);
    END IF;
    RETURN OLD;
  END IF;
END;
$function$;