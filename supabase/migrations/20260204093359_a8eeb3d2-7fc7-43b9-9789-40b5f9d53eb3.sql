-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily subscription renewal update (runs at 1 AM UTC)
SELECT cron.schedule(
  'update-subscription-renewals',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://laidjslcmowodlqxggil.supabase.co/functions/v1/update-subscription-renewals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);