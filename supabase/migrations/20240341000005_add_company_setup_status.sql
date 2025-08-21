-- Add setup_completed field to companies table
-- This field tracks whether company setup has been completed or skipped

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_setup_completed ON companies(setup_completed);

-- Add comment for documentation
COMMENT ON COLUMN companies.setup_completed IS 'Whether company setup has been completed or skipped by the user';

-- Update existing companies to mark setup as completed if they have a custom name
UPDATE companies 
SET setup_completed = true 
WHERE name != 'My Company';
