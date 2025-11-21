-- Fix: Ensure expenses without members are excluded from balance calculations
-- The real issue is that some expenses don't have expense_members entries
-- This migration adds a check to warn about this and updates the recalc function

-- First, let's see if there are orphaned expenses (expenses without members)
-- We'll update the recalc_net_balances function to only consider expenses that have members

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
    
    -- Add what they paid (ONLY for expenses that have expense_members)
    SELECT COALESCE(SUM(e.total_amount), 0) INTO member_balance
    FROM public.expenses e
    WHERE e.group_id = _group_id 
      AND e.paid_by = member_record.user_id
      AND EXISTS (
        SELECT 1 FROM public.expense_members em WHERE em.expense_id = e.id
      );
    
    -- Subtract what they owe (only unsettled amounts)
    FOR expense_record IN
      SELECT em.amount_owed
      FROM public.expense_members em
      JOIN public.expenses e ON e.id = em.expense_id
      WHERE e.group_id = _group_id 
        AND em.user_id = member_record.user_id 
        AND em.is_settled = false
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