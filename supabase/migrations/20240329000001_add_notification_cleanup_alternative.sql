-- Alternative approach: Cleanup function without pg_cron dependency
-- This function can be called manually or via external scheduling

-- Function to clean up old read notifications (older than 14 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications_manual()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete read notifications older than 14 days and return count
  WITH deleted AS (
    DELETE FROM notifications 
    WHERE is_read = true 
      AND created_at < NOW() - INTERVAL '14 days'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up % old read notifications older than 14 days', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_notifications_manual() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_old_notifications_manual() IS 'Manually deletes read notifications older than 14 days and returns the count of deleted notifications';

-- Create a view to show notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  COUNT(*) FILTER (WHERE is_read = true AND created_at < NOW() - INTERVAL '14 days') as old_read_count
FROM notifications;

-- Grant select permission on the view
GRANT SELECT ON notification_stats TO authenticated; 