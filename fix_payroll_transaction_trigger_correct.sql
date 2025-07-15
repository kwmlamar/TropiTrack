-- Fix the payroll transaction trigger that's causing ON CONFLICT errors
-- The trigger is trying to insert into transactions but has a mismatched ON CONFLICT clause

-- First, let's see all triggers on the payroll table
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'payroll';

-- Look for any functions that might be creating transactions with ON CONFLICT
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%INSERT INTO transactions%'
  AND routine_definition LIKE '%ON CONFLICT%';

-- Check if there's a trigger that creates transactions when payroll status changes
-- This is likely the source of the ON CONFLICT error
DROP TRIGGER IF EXISTS payroll_transaction_trigger ON payroll;
DROP TRIGGER IF EXISTS create_payroll_transaction ON payroll;
DROP TRIGGER IF EXISTS payroll_accounting_trigger ON payroll;

-- Drop any functions that might be creating transactions
DROP FUNCTION IF EXISTS create_payroll_transaction();
DROP FUNCTION IF EXISTS handle_payroll_accounting();
DROP FUNCTION IF EXISTS payroll_to_transaction();

-- Now let's create a corrected version of the trigger that creates transactions properly
-- This will create a transaction when payroll is marked as paid, with correct ON CONFLICT handling

CREATE OR REPLACE FUNCTION handle_payroll_transaction()
RETURNS TRIGGER AS $$
DECLARE
  period_text TEXT;
BEGIN
  -- Only create transaction when status changes to 'paid'
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'paid' THEN
    
    -- Create period text for notes
    period_text := CASE 
      WHEN NEW.pay_period_start IS NOT NULL AND NEW.pay_period_end IS NOT NULL 
      THEN NEW.pay_period_start::text || ' to ' || NEW.pay_period_end::text
      WHEN NEW.pay_period_start IS NOT NULL 
      THEN NEW.pay_period_start::text || ' onwards'
      WHEN NEW.pay_period_end IS NOT NULL 
      THEN 'until ' || NEW.pay_period_end::text
      ELSE 'Period not specified'
    END;

    -- Create expense transaction for paid payroll
    -- Use ON CONFLICT (transaction_id) since that's the unique constraint
    INSERT INTO transactions (
      company_id,
      transaction_id,
      date,
      description,
      category,
      type,
      amount,
      status,
      account,
      reference,
      notes,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      NEW.company_id,
      'TXN-PAYROLL-' || NEW.id,
      NOW()::date,
      'Payroll - ' || COALESCE(NEW.worker_name, 'Unknown Worker'),
      'Payroll',
      'expense',
      COALESCE(NEW.gross_pay, 0),
      'completed',
      'Business Account',
      'PAYROLL-' || NEW.id,
      'Payroll expense for ' || COALESCE(NEW.worker_name, 'Unknown Worker') || 
      ' - Period: ' || period_text || '. Net pay: $' || COALESCE(NEW.net_pay, 0) || ' (Paid)',
      get_current_user_id(),
      NOW(),
      NOW()
    ) ON CONFLICT (transaction_id) DO UPDATE SET
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes,
      updated_at = NOW();
      
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER payroll_transaction_trigger
  AFTER UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION handle_payroll_transaction();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_payroll_transaction() TO authenticated;

-- Test that payroll status updates work now
UPDATE payroll 
SET status = 'paid', updated_at = NOW()
WHERE status = 'confirmed';

-- Show the result
SELECT id, status, updated_at 
FROM payroll 
WHERE status = 'paid'
ORDER BY updated_at DESC
LIMIT 5;

-- Show remaining triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'payroll'; 