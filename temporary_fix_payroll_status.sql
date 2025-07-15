-- Temporary fix to test payroll status updates
-- Run this in your Supabase SQL editor

-- First, let's disable the trigger temporarily to see if that's causing the issue
DROP TRIGGER IF EXISTS payroll_notification_trigger ON payroll;

-- Now try updating a payroll status manually to test
-- Replace 'your-payroll-id-here' with an actual payroll ID from your database
-- UPDATE payroll SET status = 'paid' WHERE id = 'your-payroll-id-here';

-- If the manual update works, we know the trigger was the issue
-- Then we can recreate the trigger with a simpler version

-- Simple version of the trigger function
CREATE OR REPLACE FUNCTION handle_payroll_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For now, just return the new/old record without doing anything
  -- This will help us isolate if the trigger is causing the issue
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with the simple function
CREATE TRIGGER payroll_notification_trigger
  AFTER INSERT OR UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION handle_payroll_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_payroll_notification() TO authenticated; 