-- Revert the notification function fix
-- This will remove the temporary function we created

DROP FUNCTION IF EXISTS create_company_notification(UUID, UUID, TEXT, TEXT, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB);

-- If you want to restore the original trigger, uncomment this:
-- CREATE TRIGGER timesheet_notification_trigger
--   AFTER INSERT OR UPDATE ON timesheets
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_timesheet_notification();
