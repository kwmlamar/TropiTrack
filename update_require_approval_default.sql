-- Update the default value for require_approval to false
ALTER TABLE timesheet_settings 
ALTER COLUMN require_approval SET DEFAULT false;

-- Optional: Update existing records to false if you want to change them too
-- Uncomment the line below if you want to update all existing companies to have require_approval = false
-- UPDATE timesheet_settings SET require_approval = false;

