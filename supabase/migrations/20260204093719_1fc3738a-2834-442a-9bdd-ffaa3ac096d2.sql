-- Schedule daily notification auto-archiving (runs at 2 AM UTC)
-- Marks notifications older than 7 days as read automatically
SELECT cron.schedule(
  'auto-archive-old-notifications',
  '0 2 * * *',
  $$
  UPDATE public.notifications 
  SET is_read = true 
  WHERE is_read = false 
    AND created_at < NOW() - INTERVAL '7 days';
  $$
);

-- Clean up notifications older than 60 days
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  $$
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '60 days';
  $$
);