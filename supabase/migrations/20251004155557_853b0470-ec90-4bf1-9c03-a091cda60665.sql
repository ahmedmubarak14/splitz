-- Fix remaining security definer functions without set search_path
ALTER FUNCTION public.backfill_profile_emails() 
SET search_path = 'public';

ALTER FUNCTION public.handle_new_user() 
SET search_path = 'public';

ALTER FUNCTION public.recalc_expense_split(_expense_id uuid) 
SET search_path = 'public';

ALTER FUNCTION public.trg_recalc_on_expense_update() 
SET search_path = 'public';

ALTER FUNCTION public.trg_recalc_on_member_delete() 
SET search_path = 'public';

ALTER FUNCTION public.trg_recalc_on_member_insert() 
SET search_path = 'public';

ALTER FUNCTION public.update_habit_streak() 
SET search_path = 'public';