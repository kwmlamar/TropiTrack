-- Add indexes for payroll table to improve query performance
-- These indexes will significantly speed up common queries

-- Index for company_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON payroll(company_id);

-- Index for worker_id (for worker-specific queries)
CREATE INDEX IF NOT EXISTS idx_payroll_worker_id ON payroll(worker_id);

-- Composite index for company_id + worker_id (common combination)
CREATE INDEX IF NOT EXISTS idx_payroll_company_worker ON payroll(company_id, worker_id);

-- Index for pay_period_start (for date range queries)
CREATE INDEX IF NOT EXISTS idx_payroll_period_start ON payroll(pay_period_start);

-- Index for pay_period_end (for date range queries)
CREATE INDEX IF NOT EXISTS idx_payroll_period_end ON payroll(pay_period_end);

-- Composite index for company_id + date range (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_payroll_company_date_range ON payroll(company_id, pay_period_start, pay_period_end);

-- Index for status (for filtering by status)
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_payroll_created_at ON payroll(created_at);

-- Composite index for company_id + status (common filter combination)
CREATE INDEX IF NOT EXISTS idx_payroll_company_status ON payroll(company_id, status);

-- Add comments to explain the purpose of each index
COMMENT ON INDEX idx_payroll_company_id IS 'Index for filtering payroll records by company';
COMMENT ON INDEX idx_payroll_worker_id IS 'Index for filtering payroll records by worker';
COMMENT ON INDEX idx_payroll_company_worker IS 'Composite index for company + worker queries';
COMMENT ON INDEX idx_payroll_period_start IS 'Index for date range queries on period start';
COMMENT ON INDEX idx_payroll_period_end IS 'Index for date range queries on period end';
COMMENT ON INDEX idx_payroll_company_date_range IS 'Composite index for company + date range queries';
COMMENT ON INDEX idx_payroll_status IS 'Index for filtering by payroll status';
COMMENT ON INDEX idx_payroll_created_at IS 'Index for sorting by creation date';
COMMENT ON INDEX idx_payroll_company_status IS 'Composite index for company + status filtering'; 