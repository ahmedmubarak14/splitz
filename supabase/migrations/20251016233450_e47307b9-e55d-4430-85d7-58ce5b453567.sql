-- Function to calculate next renewal date based on billing cycle
CREATE OR REPLACE FUNCTION public.calculate_next_renewal_date(
  p_current_date DATE,
  p_cycle TEXT,
  p_custom_days INTEGER DEFAULT NULL
) RETURNS DATE AS $$
BEGIN
  CASE p_cycle
    WHEN 'weekly' THEN RETURN p_current_date + INTERVAL '7 days';
    WHEN 'monthly' THEN RETURN p_current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN p_current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN RETURN p_current_date + INTERVAL '1 year';
    WHEN 'custom' THEN RETURN p_current_date + (COALESCE(p_custom_days, 30) || ' days')::INTERVAL;
    ELSE RETURN p_current_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;