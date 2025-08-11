-- Fix the missing create_company_notification function
-- This migration addresses the error when creating timesheets

-- Option 1: Create a minimal version of the function if it doesn't exist
CREATE OR REPLACE FUNCTION create_company_notification(
  exclude_user_id UUID,
  company_uuid UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type VARCHAR(50) DEFAULT 'info',
  notification_category VARCHAR(50) DEFAULT 'general',
  action_url TEXT DEFAULT NULL,
  action_text VARCHAR(100) DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  -- For now, just log the notification attempt
  -- This prevents the error while we work on the full notification system
  RAISE NOTICE 'Notification would be created: % - %', notification_title, notification_message;
  
  -- TODO: Implement full notification logic when the notifications table is ready
  -- For now, we'll just return without doing anything to prevent errors
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_company_notification(UUID, UUID, TEXT, TEXT, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO authenticated;

-- Option 2: If you want to completely disable notifications temporarily, uncomment this:
-- DROP TRIGGER IF EXISTS timesheet_notification_trigger ON timesheets;
