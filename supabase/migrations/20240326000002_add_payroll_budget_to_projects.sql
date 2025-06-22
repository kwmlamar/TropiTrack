-- Add payroll_budget field to projects table
ALTER TABLE projects 
ADD COLUMN payroll_budget DECIMAL(12,2) CHECK (payroll_budget >= 0);

-- Add comment to explain the purpose
COMMENT ON COLUMN projects.payroll_budget IS 'Specific budget allocated for payroll/labor costs for this project';

-- Add index for payroll_budget to improve query performance
CREATE INDEX IF NOT EXISTS idx_projects_payroll_budget ON projects(payroll_budget);

-- Add composite index for company_id + payroll_budget for common queries
CREATE INDEX IF NOT EXISTS idx_projects_company_payroll_budget ON projects(company_id, payroll_budget); 