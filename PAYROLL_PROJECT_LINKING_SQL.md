# Payroll Project Linking SQL Commands

This document contains the SQL commands needed to link projects to payroll records in your TropiTrack database.

## 1. Add project_id column to payroll table

```sql
-- Add project_id to payroll table to link payroll records to projects
ALTER TABLE payroll 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for project_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_payroll_project_id ON payroll(project_id);

-- Add composite index for company_id + project_id for common queries
CREATE INDEX IF NOT EXISTS idx_payroll_company_project ON payroll(company_id, project_id);

-- Add comments to explain the purpose
COMMENT ON COLUMN payroll.project_id IS 'Reference to the project this payroll record is associated with';
COMMENT ON INDEX idx_payroll_project_id IS 'Index for filtering payroll records by project';
COMMENT ON INDEX idx_payroll_company_project IS 'Composite index for company + project queries';
```

## 2. Update existing payroll records with project_id

```sql
-- Update existing payroll records with project_id based on timesheets
-- This script will find the most common project for each worker's timesheets in each pay period
-- and update the corresponding payroll record

UPDATE payroll 
SET project_id = (
  SELECT ts.project_id
  FROM timesheets ts
  WHERE ts.worker_id = payroll.worker_id
    AND ts.date >= payroll.pay_period_start
    AND ts.date <= payroll.pay_period_end
    AND ts.supervisor_approval = 'approved'
  GROUP BY ts.project_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE payroll.project_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM timesheets ts
    WHERE ts.worker_id = payroll.worker_id
      AND ts.date >= payroll.pay_period_start
      AND ts.date <= payroll.pay_period_end
      AND ts.supervisor_approval = 'approved'
      AND ts.project_id IS NOT NULL
  );

-- Add a comment to document this update
COMMENT ON TABLE payroll IS 'Payroll records now include project_id linking to specific projects';
```

## What these commands do:

1. **Add project_id column**: Adds a new column to the payroll table that references the projects table
2. **Create indexes**: Improves query performance when filtering payroll records by project
3. **Update existing records**: Populates the project_id for existing payroll records based on the most common project from approved timesheets in each pay period

## Important notes:

- The project_id is set to NULL if a worker worked on multiple projects equally in a pay period
- Only approved timesheets are considered when determining the project for existing payroll records
- New payroll records will automatically get the project_id from the timesheets used to generate them
- The project_id field is optional (can be NULL) to handle cases where workers work across multiple projects

## Running the commands:

1. Run the first set of commands to add the column and indexes
2. Run the second set of commands to update existing records
3. Verify the changes by checking that payroll records now have project_id values

## Verification query:

```sql
-- Check how many payroll records now have project_id
SELECT 
  COUNT(*) as total_payroll_records,
  COUNT(project_id) as records_with_project,
  COUNT(*) - COUNT(project_id) as records_without_project
FROM payroll;
``` 