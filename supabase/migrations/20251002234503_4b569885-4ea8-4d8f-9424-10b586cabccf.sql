-- Auto-recalculate expense splits to keep all pages consistent

-- Core function to recalc split for a given expense
CREATE OR REPLACE FUNCTION public.recalc_expense_split(_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count integer;
  total numeric;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.expense_members
  WHERE expense_id = _expense_id;

  SELECT total_amount INTO total
  FROM public.expenses
  WHERE id = _expense_id;

  IF member_count IS NOT NULL AND member_count > 0 THEN
    UPDATE public.expense_members
    SET amount_owed = COALESCE(total, 0) / member_count
    WHERE expense_id = _expense_id;
  END IF;
END;
$$;

-- Trigger function when expenses.total_amount changes
CREATE OR REPLACE FUNCTION public.trg_recalc_on_expense_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.total_amount IS DISTINCT FROM NEW.total_amount) THEN
    PERFORM public.recalc_expense_split(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for inserts into expense_members
CREATE OR REPLACE FUNCTION public.trg_recalc_on_member_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalc_expense_split(NEW.expense_id);
  RETURN NEW;
END;
$$;

-- Trigger function for deletes from expense_members
CREATE OR REPLACE FUNCTION public.trg_recalc_on_member_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalc_expense_split(OLD.expense_id);
  RETURN OLD;
END;
$$;

-- Re-create triggers idempotently
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'recalc_split_on_expense_update'
  ) THEN
    DROP TRIGGER recalc_split_on_expense_update ON public.expenses;
  END IF;
  CREATE TRIGGER recalc_split_on_expense_update
  AFTER UPDATE OF total_amount ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_on_expense_update();

  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'recalc_split_on_member_insert'
  ) THEN
    DROP TRIGGER recalc_split_on_member_insert ON public.expense_members;
  END IF;
  CREATE TRIGGER recalc_split_on_member_insert
  AFTER INSERT ON public.expense_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_on_member_insert();

  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'recalc_split_on_member_delete'
  ) THEN
    DROP TRIGGER recalc_split_on_member_delete ON public.expense_members;
  END IF;
  CREATE TRIGGER recalc_split_on_member_delete
  AFTER DELETE ON public.expense_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_on_member_delete();
END $$;
