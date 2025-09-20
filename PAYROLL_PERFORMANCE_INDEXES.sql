-- Performance optimization indexes for payroll system
-- These indexes will significantly improve query performance for payroll operations
-- Note: Some indexes may already exist from previous migrations

-- Indexes for payroll table (only add if not already exists)
CREATE INDEX IF NOT EXISTS idx_payroll_worker_id ON payroll(worker_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period_start ON payroll(pay_period_start);
CREATE INDEX IF NOT EXISTS idx_payroll_period_end ON payroll(pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_company_status ON payroll(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payroll_company_period ON payroll(company_id, pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_worker_period ON payroll(worker_id, pay_period_start, pay_period_end);

-- Indexes for payroll_payments table
CREATE INDEX IF NOT EXISTS idx_payroll_payments_payroll_id ON payroll_payments(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_status ON payroll_payments(status);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_date ON payroll_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_payroll_status ON payroll_payments(payroll_id, status);

-- Indexes for workers table (if not already exists)
CREATE INDEX IF NOT EXISTS idx_workers_company_id ON workers(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON workers(is_active);

-- Indexes for projects table (if not already exists)
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- Composite indexes for common query patterns (only add if not already exists)
CREATE INDEX IF NOT EXISTS idx_payroll_company_status_period ON payroll(company_id, status, pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_worker_status_period ON payroll(worker_id, status, pay_period_start, pay_period_end);

-- Analyze tables to update statistics
ANALYZE payroll;
ANALYZE payroll_payments;
ANALYZE workers;
ANALYZE projects;
