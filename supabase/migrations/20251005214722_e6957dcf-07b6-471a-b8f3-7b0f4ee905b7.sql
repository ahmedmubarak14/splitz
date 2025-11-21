-- Add split type enum
CREATE TYPE public.split_type AS ENUM ('equal', 'percentage', 'custom', 'shares');

-- Add split_type column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN split_type public.split_type NOT NULL DEFAULT 'equal';

-- Add custom split fields to expense_members
ALTER TABLE public.expense_members
ADD COLUMN split_value numeric; -- stores percentage (0-100) or custom amount or share count

-- Update the recalc_expense_split function to handle different split types
CREATE OR REPLACE FUNCTION public.recalc_expense_split(_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_count integer;
  total numeric;
  split_method split_type;
  total_shares numeric;
  total_percentage numeric;
BEGIN
  -- Get expense details
  SELECT total_amount, split_type INTO total, split_method
  FROM public.expenses
  WHERE id = _expense_id;

  SELECT COUNT(*) INTO member_count
  FROM public.expense_members
  WHERE expense_id = _expense_id;

  IF member_count IS NULL OR member_count = 0 THEN
    RETURN;
  END IF;

  -- Handle different split types
  IF split_method = 'equal' THEN
    -- Equal split: divide total by number of members
    UPDATE public.expense_members
    SET amount_owed = COALESCE(total, 0) / member_count,
        split_value = NULL
    WHERE expense_id = _expense_id;
    
  ELSIF split_method = 'percentage' THEN
    -- Percentage split: calculate based on percentage
    UPDATE public.expense_members
    SET amount_owed = COALESCE(total, 0) * (COALESCE(split_value, 0) / 100)
    WHERE expense_id = _expense_id;
    
  ELSIF split_method = 'custom' THEN
    -- Custom split: use the custom amount directly
    UPDATE public.expense_members
    SET amount_owed = COALESCE(split_value, 0)
    WHERE expense_id = _expense_id;
    
  ELSIF split_method = 'shares' THEN
    -- Shares split: divide based on share count
    SELECT SUM(COALESCE(split_value, 1)) INTO total_shares
    FROM public.expense_members
    WHERE expense_id = _expense_id;
    
    IF total_shares > 0 THEN
      UPDATE public.expense_members
      SET amount_owed = COALESCE(total, 0) * (COALESCE(split_value, 1) / total_shares)
      WHERE expense_id = _expense_id;
    END IF;
  END IF;
END;
$function$;