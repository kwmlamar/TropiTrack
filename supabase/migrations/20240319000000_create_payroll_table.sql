-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
  nib_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
  position TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'void')),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_worker_id ON payroll(worker_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_worker_period ON payroll(worker_id, pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_company_period ON payroll(company_id, pay_period_start, pay_period_end);

-- Add RLS policies
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Policy for users to see payroll records for their company
CREATE POLICY "Users can view payroll records for their company" ON payroll
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy for users to insert payroll records for their company
CREATE POLICY "Users can insert payroll records for their company" ON payroll
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy for users to update payroll records for their company
CREATE POLICY "Users can update payroll records for their company" ON payroll
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy for users to delete payroll records for their company
CREATE POLICY "Users can delete payroll records for their company" ON payroll
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE payroll IS 'Payroll records for workers';
COMMENT ON COLUMN payroll.worker_id IS 'Reference to the worker this payroll record is for';
COMMENT ON COLUMN payroll.worker_name IS 'Name of the worker at the time of payroll creation';
COMMENT ON COLUMN payroll.project_id IS 'Reference to the project this payroll record is associated with';
COMMENT ON COLUMN payroll.project_name IS 'Name of the project at the time of payroll creation';
COMMENT ON COLUMN payroll.total_hours IS 'Total regular hours worked in the pay period';
COMMENT ON COLUMN payroll.overtime_hours IS 'Total overtime hours worked in the pay period';
COMMENT ON COLUMN payroll.hourly_rate IS 'Hourly rate for the worker';
COMMENT ON COLUMN payroll.gross_pay IS 'Gross pay before deductions';
COMMENT ON COLUMN payroll.nib_deduction IS 'NIB (National Insurance Board) deduction amount';
COMMENT ON COLUMN payroll.other_deductions IS 'Other deductions amount';
COMMENT ON COLUMN payroll.total_deductions IS 'Total deductions (NIB + other)';
COMMENT ON COLUMN payroll.net_pay IS 'Net pay after deductions';
COMMENT ON COLUMN payroll.position IS 'Worker position at the time of payroll creation';
COMMENT ON COLUMN payroll.department IS 'Worker department at the time of payroll creation';
COMMENT ON COLUMN payroll.status IS 'Payroll status: pending, confirmed, paid, or void';
COMMENT ON COLUMN payroll.company_id IS 'Reference to the company this payroll record belongs to';
COMMENT ON COLUMN payroll.pay_period_start IS 'Start date of the pay period';
COMMENT ON COLUMN payroll.pay_period_end IS 'End date of the pay period';
COMMENT ON COLUMN payroll.created_by IS 'Reference to the user who created this payroll record'; 