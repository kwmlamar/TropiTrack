-- Add created_by field to timesheets table to track who created each timesheet
-- This will help prevent self-notifications more reliably

-- Add the created_by column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Update the timesheet notification function to use created_by field
CREATE OR REPLACE FUNCTION handle_timesheet_notification()
RETURNS TRIGGER AS $$
DECLARE
  worker_name TEXT;
  project_name TEXT;
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID from auth context first
  current_user_id := get_current_user_id();
  
  -- If auth context doesn't work, use the created_by field
  IF current_user_id IS NULL THEN
    current_user_id := NEW.created_by;
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
DROP TRIGGER IF EXISTS timesheet_notification_trigger ON timesheets;
CREATE TRIGGER timesheet_notification_trigger
  AFTER INSERT OR UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION handle_timesheet_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_timesheet_notification() TO authenticated; 