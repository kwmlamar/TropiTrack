-- Add nib_exempt column to workers table for per-worker NIB control
-- This allows companies to exempt specific workers from NIB deductions
-- (e.g., contractors, part-time workers, or exempt employees)

-- ============================================================================
-- ADD NIB EXEMPT FIELD TO WORKERS TABLE
-- ============================================================================
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS nib_exempt BOOLEAN NOT NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN workers.nib_exempt IS 'When true, this worker is exempt from NIB deductions regardless of company settings. Useful for contractors, part-time workers, or exempt employees.';

-- Add index for filtering workers by NIB exemption status
CREATE INDEX IF NOT EXISTS idx_workers_nib_exempt ON workers(nib_exempt) WHERE nib_exempt = true;

-- Update existing records to have nib_exempt = false by default (no change in behavior)
UPDATE workers
SET nib_exempt = false
WHERE nib_exempt IS NULL;

-- ============================================================================
-- NOTES
-- ============================================================================
-- NIB Calculation Logic:
-- 1. If payroll_settings.nib_enabled = false → No NIB for anyone
-- 2. If payroll_settings.nib_enabled = true AND worker.nib_exempt = false → Apply NIB
-- 3. If payroll_settings.nib_enabled = true AND worker.nib_exempt = true → No NIB for this worker


