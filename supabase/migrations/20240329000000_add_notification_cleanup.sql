-- Enable the pg_cron extension (required for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to clean up old read notifications (older than 14 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete read notifications older than 14 days
  DELETE FROM notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '14 days';
  
  -- Log the cleanup (optional)
  RAISE NOTICE 'Cleaned up old read notifications older than 14 days';
END;
$$;

-- Create a scheduled job to run cleanup daily at 2 AM
-- Note: This requires pg_cron to be enabled in Supabase
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *', -- Daily at 2:00 AM
  'SELECT cleanup_old_notifications();'
);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Deletes read notifications older than 14 days to keep the database clean'; 