-- Remove the scheduled job
SELECT cron.unschedule('cleanup-old-notifications');

-- Drop the cleanup function
DROP FUNCTION IF EXISTS cleanup_old_notifications(); 