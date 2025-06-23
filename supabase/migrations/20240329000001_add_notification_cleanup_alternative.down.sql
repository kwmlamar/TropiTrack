-- Drop the view
DROP VIEW IF EXISTS notification_stats;

-- Drop the manual cleanup function
DROP FUNCTION IF EXISTS cleanup_old_notifications_manual(); 