-- Add notification triggers for automatic company-wide notifications

-- Function to get all users in a company (excluding the user who triggered the action)
CREATE OR REPLACE FUNCTION get_company_users_except(exclude_user_id UUID, company_uuid UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id
  FROM profiles p
  WHERE p.company_id = company_uuid 
    AND (exclude_user_id IS NULL OR p.id != exclude_user_id)
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for all company users
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
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT * FROM get_company_users_except(exclude_user_id, company_uuid)
  LOOP
    INSERT INTO notifications (
      user_id,
      company_id,
      title,
      message,
      type,
      category,
      is_read,
      action_url,
      action_text,
      metadata
    ) VALUES (
      user_record.user_id,
      company_uuid,
      notification_title,
      notification_message,
      notification_type,
      notification_category,
      false,
      action_url,
      action_text,
      metadata
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID from auth context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Timesheet triggers
CREATE OR REPLACE FUNCTION handle_timesheet_notification()
RETURNS TRIGGER AS $$
DECLARE
  worker_name TEXT;
  project_name TEXT;
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  
  -- Get worker and project details
  SELECT w.name, p.name, p.company_id
  INTO worker_name, project_name, company_uuid
  FROM workers w
  JOIN projects p ON w.company_id = p.company_id
  WHERE w.id = NEW.worker_id AND p.id = NEW.project_id;
  
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project triggers
CREATE OR REPLACE FUNCTION handle_project_notification()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  
  -- Get client details
  SELECT c.name, NEW.company_id
  INTO client_name, company_uuid
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  IF TG_OP = 'INSERT' THEN
    -- New project created
    PERFORM create_company_notification(
      current_user_id,
      company_uuid,
      'New Project Created',
      'Project "' || NEW.name || '" has been created for ' || client_name,
      'info',
      'project',
      '/dashboard/projects/' || NEW.id,
      'View Project',
      jsonb_build_object(
        'project_id', NEW.id,
        'client_id', NEW.client_id
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Project status changed
    IF NEW.status = 'completed' THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Project Completed',
        'Project "' || NEW.name || '" has been marked as completed',
        'success',
        'project',
        '/dashboard/projects/' || NEW.id,
        'View Project',
        jsonb_build_object(
          'project_id', NEW.id
        )
      );
    ELSIF NEW.status = 'on_hold' THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Project On Hold',
        'Project "' || NEW.name || '" has been put on hold',
        'warning',
        'project',
        '/dashboard/projects/' || NEW.id,
        'View Project',
        jsonb_build_object(
          'project_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Worker triggers
CREATE OR REPLACE FUNCTION handle_worker_notification()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  company_uuid := NEW.company_id;
  
  IF TG_OP = 'INSERT' THEN
    -- New worker added
    PERFORM create_company_notification(
      current_user_id,
      company_uuid,
      'New Worker Added',
      NEW.name || ' has been added to the team',
      'info',
      'worker',
      '/dashboard/workers/' || NEW.id,
      'View Worker',
      jsonb_build_object(
        'worker_id', NEW.id,
        'role', NEW.role
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
    -- Worker status changed
    IF NEW.is_active = false THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Worker Deactivated',
        NEW.name || ' has been deactivated',
        'warning',
        'worker',
        '/dashboard/workers',
        'View Workers',
        jsonb_build_object(
          'worker_id', NEW.id
        )
      );
    ELSIF NEW.is_active = true THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Worker Reactivated',
        NEW.name || ' has been reactivated',
        'success',
        'worker',
        '/dashboard/workers/' || NEW.id,
        'View Worker',
        jsonb_build_object(
          'worker_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Client triggers
CREATE OR REPLACE FUNCTION handle_client_notification()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  company_uuid := NEW.company_id;
  
  IF TG_OP = 'INSERT' THEN
    -- New client added
    PERFORM create_company_notification(
      current_user_id,
      company_uuid,
      'New Client Added',
      'Client "' || NEW.name || '" has been added',
      'info',
      'client',
      '/dashboard/clients',
      'View Clients',
      jsonb_build_object(
        'client_id', NEW.id
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
    -- Client status changed
    IF NEW.is_active = false THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Client Deactivated',
        'Client "' || NEW.name || '" has been deactivated',
        'warning',
        'client',
        '/dashboard/clients',
        'View Clients',
        jsonb_build_object(
          'client_id', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Payroll triggers
CREATE OR REPLACE FUNCTION handle_payroll_notification()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  company_uuid := NEW.company_id;
  
  IF TG_OP = 'INSERT' THEN
    -- New payroll generated
    PERFORM create_company_notification(
      current_user_id,
      company_uuid,
      'Payroll Generated',
      'Payroll for ' || NEW.worker_name || ' has been generated for period ' || NEW.pay_period_start || ' to ' || NEW.pay_period_end || ' ($' || NEW.gross_pay || ')',
      'success',
      'payroll',
      '/dashboard/payroll',
      'View Payroll',
      jsonb_build_object(
        'payroll_id', NEW.id,
        'worker_id', NEW.worker_id,
        'worker_name', NEW.worker_name,
        'pay_period_start', NEW.pay_period_start,
        'pay_period_end', NEW.pay_period_end,
        'gross_pay', NEW.gross_pay
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Payroll status changed
    IF NEW.status = 'confirmed' THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Payroll Confirmed',
        'Payroll for ' || NEW.worker_name || ' has been confirmed for period ' || NEW.pay_period_start || ' to ' || NEW.pay_period_end || ' ($' || NEW.gross_pay || ')',
        'success',
        'payroll',
        '/dashboard/payroll',
        'View Payroll',
        jsonb_build_object(
          'payroll_id', NEW.id,
          'worker_id', NEW.worker_id,
          'worker_name', NEW.worker_name,
          'pay_period_start', NEW.pay_period_start,
          'pay_period_end', NEW.pay_period_end,
          'gross_pay', NEW.gross_pay,
          'confirmed_by', current_user_id
        )
      );
    ELSIF NEW.status = 'paid' THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Payroll Paid',
        'Payroll for ' || NEW.worker_name || ' has been marked as paid for period ' || NEW.pay_period_start || ' to ' || NEW.pay_period_end || ' ($' || NEW.gross_pay || ')',
        'success',
        'payroll',
        '/dashboard/payroll',
        'View Payroll',
        jsonb_build_object(
          'payroll_id', NEW.id,
          'worker_id', NEW.worker_id,
          'worker_name', NEW.worker_name,
          'pay_period_start', NEW.pay_period_start,
          'pay_period_end', NEW.pay_period_end,
          'gross_pay', NEW.gross_pay,
          'paid_by', current_user_id
        )
      );
    ELSIF NEW.status = 'void' THEN
      PERFORM create_company_notification(
        current_user_id,
        company_uuid,
        'Payroll Voided',
        'Payroll for ' || NEW.worker_name || ' has been voided for period ' || NEW.pay_period_start || ' to ' || NEW.pay_period_end,
        'warning',
        'payroll',
        '/dashboard/payroll',
        'View Payroll',
        jsonb_build_object(
          'payroll_id', NEW.id,
          'worker_id', NEW.worker_id,
          'worker_name', NEW.worker_name,
          'pay_period_start', NEW.pay_period_start,
          'pay_period_end', NEW.pay_period_end,
          'voided_by', current_user_id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS timesheet_notification_trigger ON timesheets;
CREATE TRIGGER timesheet_notification_trigger
  AFTER INSERT OR UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION handle_timesheet_notification();

DROP TRIGGER IF EXISTS project_notification_trigger ON projects;
CREATE TRIGGER project_notification_trigger
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_notification();

DROP TRIGGER IF EXISTS worker_notification_trigger ON workers;
CREATE TRIGGER worker_notification_trigger
  AFTER INSERT OR UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION handle_worker_notification();

DROP TRIGGER IF EXISTS client_notification_trigger ON clients;
CREATE TRIGGER client_notification_trigger
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION handle_client_notification();

DROP TRIGGER IF EXISTS payroll_notification_trigger ON payroll;
CREATE TRIGGER payroll_notification_trigger
  AFTER INSERT OR UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION handle_payroll_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_company_users_except(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_company_notification(UUID, UUID, TEXT, TEXT, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_timesheet_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_project_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_worker_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_client_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_payroll_notification() TO authenticated; 