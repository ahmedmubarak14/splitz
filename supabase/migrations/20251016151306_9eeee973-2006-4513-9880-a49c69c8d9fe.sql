-- Add subscription status and notification features

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'paused', 'archived');

-- Add status column to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS status subscription_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS reminder_days_before integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone;

-- Create notification function for upcoming renewals
CREATE OR REPLACE FUNCTION notify_upcoming_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  -- Find subscriptions that need renewal notifications
  FOR sub_record IN
    SELECT s.id, s.name, s.next_renewal_date, s.amount, s.currency, s.user_id, s.reminder_days_before
    FROM subscriptions s
    WHERE s.status = 'active'
      AND s.notifications_enabled = true
      AND s.next_renewal_date IS NOT NULL
      AND s.next_renewal_date::date = (CURRENT_DATE + s.reminder_days_before)
  LOOP
    -- Create notification for subscription owner
    PERFORM create_notification(
      sub_record.user_id,
      'Subscription Renewal',
      sub_record.name || ' renews in ' || sub_record.reminder_days_before || ' days (' || sub_record.amount || ' ' || sub_record.currency || ')',
      'subscription',
      sub_record.id
    );
  END LOOP;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION notify_upcoming_subscriptions() IS 'Sends notifications for subscriptions that are due for renewal based on reminder_days_before setting';