-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON subscriptions(status, next_renewal_date) WHERE status = 'active';

-- Add unique constraint on subscription_templates name for future upserts
ALTER TABLE subscription_templates ADD CONSTRAINT subscription_templates_name_unique UNIQUE (name);