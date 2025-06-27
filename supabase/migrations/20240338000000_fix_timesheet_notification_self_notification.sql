-- Fix timesheet notification to prevent self-notifications
-- The issue is that auth.uid() might not be available in all contexts

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS timesheet_notification_trigger ON timesheets;

-- Update the timesheet notification function to be more robust
CREATE OR REPLACE FUNCTION handle_timesheet_notification()
RETURNS TRIGGER AS $$
DECLARE
  worker_name TEXT;
  project_name TEXT;
  company_uuid UUID;
  current_user_id UUID;
  worker_profile_id UUID;
BEGIN
  -- Try to get current user ID from auth context
  current_user_id := get_current_user_id();
  
  -- If we can't get the current user ID, try to get it from the worker's profile
  -- This assumes the worker submitting the timesheet is the current user
  IF current_user_id IS NULL THEN
    SELECT p.id INTO current_user_id
    FROM profiles p
    JOIN workers w ON w.name = p.full_name OR w.email = p.email
    WHERE w.id = NEW.worker_id
    LIMIT 1;
  END IF;
  
  -- Get worker and project details
  SELECT w.name, p.name, p.company_id
  INTO worker_name, project_name, company_uuid
  FROM workers w
  JOIN projects p ON w.company_id = p.company_id
  WHERE w.id = NEW.worker_id AND p.id = NEW.project_id;
  
  -- Only create notifications if we have a valid company and current user
  IF company_uuid IS NOT NULL AND current_user_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      -- New timesheet submitted - notify all company users except the current user
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Timesheet Submitted',
        worker_name || ' submitted a timesheet for ' || project_name || ' (' || NEW.total_hours || ' hours on ' || NEW.date || ')',
        'info',
        'timesheet',
        '/dashboard/timesheets',
        'Review Timesheet',
        jsonb_build_object(
          'worker_id', NEW.worker_id,
          'project_id', NEW.project_id,
          'timesheet_id', NEW.id,
          'total_hours', NEW.total_hours,
          'date', NEW.date
        )
      );
    ELSIF TG_OP = 'UPDATE' AND OLD.supervisor_approval != NEW.supervisor_approval THEN
      -- Timesheet status changed
      IF NEW.supervisor_approval = 'approved' THEN
        PERFORM create_company_notification(
          current_user_id,
          company_uuid,
          'Timesheet Approved',
          'Timesheet for ' || project_name || ' has been approved',
          'success',
          'timesheet',
          '/dashboard/timesheets',
          'View Timesheet',
          jsonb_build_object(
            'worker_id', NEW.worker_id,
            'project_id', NEW.project_id,
            'timesheet_id', NEW.id
          )
        );
      ELSIF NEW.supervisor_approval = 'rejected' THEN
        PERFORM create_company_notification(
          current_user_id,
          company_uuid,
          'Timesheet Rejected',
          'Timesheet for ' || project_name || ' has been rejected',
          'error',
          'timesheet',
          '/dashboard/timesheets',
          'View Timesheet',
          jsonb_build_object(
            'worker_id', NEW.worker_id,
            'project_id', NEW.project_id,
            'timesheet_id', NEW.id
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER timesheet_notification_trigger
  AFTER INSERT OR UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION handle_timesheet_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_timesheet_notification() TO authenticated; 