-- Add nib_enabled column to payroll_settings table
ALTER TABLE payroll_settings
ADD COLUMN IF NOT EXISTS nib_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment to the column
COMMENT ON COLUMN payroll_settings.nib_enabled IS 'Toggle to enable/disable NIB deductions. When disabled, NIB rate will be treated as 0.';

-- Update existing records to have nib_enabled = true by default
UPDATE payroll_settings
SET nib_enabled = true
WHERE nib_enabled IS NULL;


