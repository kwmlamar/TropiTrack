-- Create biometric_enrollments table
CREATE TABLE IF NOT EXISTS biometric_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('fingerprint', 'face', 'both')),
  device_id TEXT NOT NULL,
  template_hash TEXT NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add partial unique constraint for active enrollments
CREATE UNIQUE INDEX IF NOT EXISTS idx_biometric_enrollments_active_unique 
ON biometric_enrollments (worker_id, enrollment_type) 
WHERE is_active = true;

-- Add biometric fields to workers table
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS biometric_enrollment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS biometric_type TEXT CHECK (biometric_type IN ('fingerprint', 'face', 'both', 'none')),
ADD COLUMN IF NOT EXISTS biometric_device_id TEXT,
ADD COLUMN IF NOT EXISTS biometric_template_hash TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_worker_id ON biometric_enrollments(worker_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_company_id ON biometric_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_active ON biometric_enrollments(is_active);
CREATE INDEX IF NOT EXISTS idx_workers_biometric_enrolled ON workers(biometric_enrolled);

-- Create function to update worker biometric status
CREATE OR REPLACE FUNCTION update_worker_biometric_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update worker biometric status when enrollment is created/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE workers 
    SET 
      biometric_enrolled = true,
      biometric_enrollment_date = NEW.enrollment_date,
      biometric_type = NEW.enrollment_type,
      biometric_device_id = NEW.device_id,
      biometric_template_hash = NEW.template_hash,
      updated_at = NOW()
    WHERE id = NEW.worker_id;
  END IF;
  
  -- Clear worker biometric status when enrollment is deactivated
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE workers 
    SET 
      biometric_enrolled = false,
      biometric_enrollment_date = NULL,
      biometric_type = 'none',
      biometric_device_id = NULL,
      biometric_template_hash = NULL,
      updated_at = NOW()
    WHERE id = NEW.worker_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update worker biometric status
DROP TRIGGER IF EXISTS trigger_update_worker_biometric_status ON biometric_enrollments;
CREATE TRIGGER trigger_update_worker_biometric_status
  AFTER INSERT OR UPDATE ON biometric_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_biometric_status();

-- Create function to get biometric enrollment status
CREATE OR REPLACE FUNCTION get_biometric_enrollment_status(p_worker_id UUID)
RETURNS TABLE(
  worker_id UUID,
  is_enrolled BOOLEAN,
  enrollment_type TEXT,
  enrollment_date TIMESTAMP WITH TIME ZONE,
  last_verification TIMESTAMP WITH TIME ZONE,
  device_compatibility JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as worker_id,
    COALESCE(w.biometric_enrolled, false) as is_enrolled,
    COALESCE(w.biometric_type, 'none') as enrollment_type,
    w.biometric_enrollment_date as enrollment_date,
    NULL::TIMESTAMP WITH TIME ZONE as last_verification, -- Will be implemented later
    '{"fingerprint": false, "face": false, "webauthn": false}'::JSONB as device_compatibility -- Will be dynamic
  FROM workers w
  WHERE w.id = p_worker_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE biometric_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see enrollments for workers in their company
CREATE POLICY "Users can view biometric enrollments for their company workers" ON biometric_enrollments
  FOR SELECT USING (company_id = get_user_company_id());

-- Policy: Users can insert enrollments for workers in their company
CREATE POLICY "Users can insert biometric enrollments for their company workers" ON biometric_enrollments
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Policy: Users can update enrollments for workers in their company
CREATE POLICY "Users can update biometric enrollments for their company workers" ON biometric_enrollments
  FOR UPDATE USING (company_id = get_user_company_id());

-- Policy: Users can delete enrollments for workers in their company
CREATE POLICY "Users can delete biometric enrollments for their company workers" ON biometric_enrollments
  FOR DELETE USING (company_id = get_user_company_id()); 