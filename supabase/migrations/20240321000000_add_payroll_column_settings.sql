-- Add column_settings to payroll_settings table
ALTER TABLE payroll_settings
ADD COLUMN column_settings JSONB DEFAULT '{}'::jsonb;

-- Add a comment to explain the column
COMMENT ON COLUMN payroll_settings.column_settings IS 'JSON object storing column visibility preferences for the payroll table'; 