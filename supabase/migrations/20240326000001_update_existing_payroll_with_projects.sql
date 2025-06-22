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