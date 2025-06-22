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