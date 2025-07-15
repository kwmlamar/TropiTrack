-- Fix payroll notification trigger syntax error
-- Run this in your Supabase SQL editor

-- Drop the existing payroll notification trigger
DROP TRIGGER IF EXISTS payroll_notification_trigger ON payroll;

-- Recreate the payroll notification function with correct syntax
CREATE OR REPLACE FUNCTION handle_payroll_notification()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := get_current_user_id();
  company_uuid := NEW.company_id;
  
  -- Only proceed if we have a valid current user ID
  IF current_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    -- New payroll generated - notify all company users except the current user
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
    -- Payroll status changed - notify all company users except the current user
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
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the payroll notification trigger
CREATE TRIGGER payroll_notification_trigger
  AFTER INSERT OR UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION handle_payroll_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_payroll_notification() TO authenticated; 