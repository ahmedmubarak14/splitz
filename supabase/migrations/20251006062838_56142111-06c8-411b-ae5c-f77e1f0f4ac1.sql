-- Phase 2: Debt Simplification & Who Owes Whom

-- Create net_balances table to track simplified debts between users
CREATE TABLE IF NOT EXISTS public.net_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, from_user_id, to_user_id)
);

-- Enable RLS
ALTER TABLE public.net_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for net_balances
CREATE POLICY "Group members can view net balances"
  ON public.net_balances
  FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "System can insert net balances"
  ON public.net_balances
  FOR INSERT
  WITH CHECK (is_group_member(auth.uid(), group_id));

CREATE POLICY "System can update net balances"
  ON public.net_balances
  FOR UPDATE
  USING (is_group_member(auth.uid(), group_id));

-- Function to recalculate net balances for a group
CREATE OR REPLACE FUNCTION public.recalc_net_balances(_group_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_record RECORD;
  expense_record RECORD;
  member_balance NUMERIC;
BEGIN
  -- Delete existing net balances for this group
  DELETE FROM public.net_balances WHERE group_id = _group_id;
  
  -- Calculate individual balances (what each person paid - what they owe)
  CREATE TEMP TABLE IF NOT EXISTS temp_balances (
    user_id UUID,
    balance NUMERIC
  );
  
  TRUNCATE temp_balances;
  
  -- Get all group members
  FOR member_record IN 
    SELECT DISTINCT user_id 
    FROM public.expense_group_members 
    WHERE group_id = _group_id
    UNION
    SELECT created_by FROM public.expense_groups WHERE id = _group_id
  LOOP
    member_balance := 0;
    
    -- Add what they paid
    SELECT COALESCE(SUM(total_amount), 0) INTO member_balance
    FROM public.expenses
    WHERE group_id = _group_id AND paid_by = member_record.user_id;
    
    -- Subtract what they owe
    FOR expense_record IN
      SELECT em.amount_owed
      FROM public.expense_members em
      JOIN public.expenses e ON e.id = em.expense_id
      WHERE e.group_id = _group_id AND em.user_id = member_record.user_id AND em.is_settled = false
    LOOP
      member_balance := member_balance - expense_record.amount_owed;
    END LOOP;
    
    INSERT INTO temp_balances VALUES (member_record.user_id, member_balance);
  END LOOP;
  
  -- Simplify debts: Create net balances from negative to positive balances
  FOR member_record IN 
    SELECT user_id, balance 
    FROM temp_balances 
    WHERE balance < -0.01 
    ORDER BY balance ASC
  LOOP
    DECLARE
      remaining_debt NUMERIC := ABS(member_record.balance);
      creditor_record RECORD;
    BEGIN
      -- Match this debtor with creditors
      FOR creditor_record IN
        SELECT user_id, balance
        FROM temp_balances
        WHERE balance > 0.01
        ORDER BY balance DESC
      LOOP
        IF remaining_debt < 0.01 THEN
          EXIT;
        END IF;
        
        DECLARE
          transfer_amount NUMERIC := LEAST(remaining_debt, creditor_record.balance);
        BEGIN
          IF transfer_amount > 0.01 THEN
            -- Create net balance record
            INSERT INTO public.net_balances (group_id, from_user_id, to_user_id, amount)
            VALUES (_group_id, member_record.user_id, creditor_record.user_id, ROUND(transfer_amount, 2));
            
            -- Update remaining balances
            remaining_debt := remaining_debt - transfer_amount;
            
            UPDATE temp_balances 
            SET balance = balance - transfer_amount 
            WHERE user_id = creditor_record.user_id;
          END IF;
        END;
      END LOOP;
    END;
  END LOOP;
  
  DROP TABLE IF EXISTS temp_balances;
END;
$$;

-- Trigger to recalculate net balances when expenses change
CREATE OR REPLACE FUNCTION public.trg_recalc_net_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.recalc_net_balances(NEW.group_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_net_balances(OLD.group_id);
    RETURN OLD;
  END IF;
END;
$$;

-- Add triggers to expenses table
DROP TRIGGER IF EXISTS recalc_net_balances_on_expense ON public.expenses;
CREATE TRIGGER recalc_net_balances_on_expense
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_net_balances();

-- Add triggers to expense_members for settlement changes
DROP TRIGGER IF EXISTS recalc_net_balances_on_settlement ON public.expense_members;
CREATE TRIGGER recalc_net_balances_on_settlement
AFTER UPDATE OF is_settled ON public.expense_members
FOR EACH ROW
EXECUTE FUNCTION public.trg_recalc_net_balances();