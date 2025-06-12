-- Drop the foreign key constraint first
ALTER TABLE payroll_settings
DROP CONSTRAINT IF EXISTS fk_payroll_settings_payment_schedule;

-- Drop the columns we don't need anymore
ALTER TABLE payroll_settings
DROP COLUMN IF EXISTS default_pay_period_type,
DROP COLUMN IF EXISTS default_nib_rate,
DROP COLUMN IF EXISTS pay_schedule_id;

-- Rename the default_nib_rate column to nib_rate if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'payroll_settings'
    AND column_name = 'default_nib_rate'
  ) THEN
    ALTER TABLE payroll_settings RENAME COLUMN default_nib_rate TO nib_rate;
  END IF;
END $$; 