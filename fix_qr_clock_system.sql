-- Fix QR Clock System - Run this in your Supabase SQL Editor

-- ============================================================================
-- HELPER FUNCTION TO GET USER'S COMPANY ID
-- ============================================================================
-- Create a function that can safely get the user's company_id without RLS recursion
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- ADD BIOMETRIC SUPPORT TO WORKERS TABLE
-- ============================================================================
-- Add biometric fields to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(255);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_device_used VARCHAR(255);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_location JSONB;

-- ============================================================================
-- PROJECT LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  qr_code_id UUID UNIQUE, -- Will be set when QR code is generated
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QR CODES TABLE (SIMPLIFIED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_location_id UUID NOT NULL REFERENCES project_locations(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) UNIQUE NOT NULL, -- Unique hash for the QR code
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLOCK EVENTS TABLE (ENHANCED FOR SECURITY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clock_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('clock_in', 'clock_out')),
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB, -- Store device fingerprint, GPS coordinates, biometric data, etc.
  notes TEXT,
  security_flags JSONB, -- Store security violation flags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECURITY VIOLATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  violation_type VARCHAR(100) NOT NULL, -- 'buddy_punching', 'location_mismatch', 'time_violation', etc.
  description TEXT,
  device_info JSONB,
  location_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE AND SECURITY
-- ============================================================================
-- Project locations indexes
CREATE INDEX IF NOT EXISTS idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_company_id ON project_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_qr_code_id ON project_locations(qr_code_id);

-- QR codes indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_company_id ON qr_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_project_location_id ON qr_codes(project_location_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code_hash ON qr_codes(code_hash);

-- Clock events indexes
CREATE INDEX IF NOT EXISTS idx_clock_events_worker_id ON clock_events(worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_project_id ON clock_events(project_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_event_time ON clock_events(event_time);
CREATE INDEX IF NOT EXISTS idx_clock_events_worker_date ON clock_events(worker_id, event_time);
CREATE INDEX IF NOT EXISTS idx_clock_events_qr_code_id ON clock_events(qr_code_id);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_clock_events_recent ON clock_events(worker_id, project_id, event_time);
CREATE INDEX IF NOT EXISTS idx_security_violations_worker ON security_violations(worker_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_company ON security_violations(company_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_timestamp ON security_violations(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Project locations policies
CREATE POLICY "Users can view project locations for their company" ON project_locations
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert project locations for their company" ON project_locations
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update project locations for their company" ON project_locations
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete project locations for their company" ON project_locations
  FOR DELETE USING (company_id = get_user_company_id());

-- QR codes policies
CREATE POLICY "Users can view QR codes for their company" ON qr_codes
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert QR codes for their company" ON qr_codes
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update QR codes for their company" ON qr_codes
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete QR codes for their company" ON qr_codes
  FOR DELETE USING (company_id = get_user_company_id());

-- Clock events policies
CREATE POLICY "Users can view clock events for their company" ON clock_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workers w 
      WHERE w.id = clock_events.worker_id 
      AND w.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert clock events for their company" ON clock_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workers w 
      WHERE w.id = clock_events.worker_id 
      AND w.company_id = get_user_company_id()
    )
  );

-- Security violations policies
CREATE POLICY "Users can view security violations for their company" ON security_violations
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert security violations for their company" ON security_violations
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update security violations for their company" ON security_violations
  FOR UPDATE USING (company_id = get_user_company_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
-- Function to generate unique QR code hash
CREATE OR REPLACE FUNCTION generate_qr_code_hash()
RETURNS VARCHAR(255)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 'QR_' || encode(gen_random_bytes(16), 'hex') || '_' || extract(epoch from now())::bigint;
$$;

-- Function to get worker's current clock status (SIMPLIFIED)
CREATE OR REPLACE FUNCTION get_worker_clock_status(worker_uuid UUID, project_uuid UUID)
RETURNS TABLE(
  last_event_type VARCHAR(50),
  last_event_time TIMESTAMP WITH TIME ZONE,
  is_clocked_in BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH last_events AS (
    SELECT 
      event_type,
      event_time,
      ROW_NUMBER() OVER (PARTITION BY event_type ORDER BY event_time DESC) as rn
    FROM clock_events 
    WHERE worker_id = worker_uuid 
      AND project_id = project_uuid
      AND event_time >= CURRENT_DATE
  ),
  clock_status AS (
    SELECT 
      MAX(CASE WHEN event_type = 'clock_in' AND rn = 1 THEN event_time END) as last_clock_in,
      MAX(CASE WHEN event_type = 'clock_out' AND rn = 1 THEN event_time END) as last_clock_out
    FROM last_events
  )
  SELECT 
    CASE 
      WHEN last_clock_in > COALESCE(last_clock_out, '1900-01-01'::timestamp) THEN 'clock_in'
      ELSE 'clock_out'
    END as last_event_type,
    GREATEST(last_clock_in, last_clock_out) as last_event_time,
    last_clock_in > COALESCE(last_clock_out, '1900-01-01'::timestamp) as is_clocked_in
  FROM clock_status;
$$;

-- Function to log security violations
CREATE OR REPLACE FUNCTION log_security_violation(
  worker_uuid UUID,
  violation_type VARCHAR(100),
  violation_description TEXT,
  device_data JSONB DEFAULT NULL,
  location_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
DECLARE
  company_uuid UUID;
  violation_id UUID;
BEGIN
  -- Get worker's company ID
  SELECT company_id INTO company_uuid FROM workers WHERE id = worker_uuid;
  
  -- Insert violation record
  INSERT INTO security_violations (
    worker_id, 
    company_id, 
    violation_type, 
    description, 
    device_info, 
    location_data
  ) VALUES (
    worker_uuid,
    company_uuid,
    violation_type,
    violation_description,
    device_data,
    location_data
  ) RETURNING id INTO violation_id;
  
  RETURN violation_id;
END;
$$;

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(worker_uuid UUID, project_uuid UUID)
RETURNS TABLE(
  is_suspicious BOOLEAN,
  reason TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
DECLARE
  recent_events_count INTEGER;
  last_event_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check for rapid successive events (within 30 seconds)
  SELECT COUNT(*), MAX(event_time) 
  INTO recent_events_count, last_event_time
  FROM clock_events 
  WHERE worker_id = worker_uuid 
    AND project_id = project_uuid
    AND event_time >= NOW() - INTERVAL '30 seconds';
  
  IF recent_events_count > 1 THEN
    RETURN QUERY SELECT true, 'Rapid successive clock events detected';
    RETURN;
  END IF;
  
  -- Check for multiple events in short time period
  SELECT COUNT(*) INTO recent_events_count
  FROM clock_events 
  WHERE worker_id = worker_uuid 
    AND project_id = project_uuid
    AND event_time >= NOW() - INTERVAL '1 hour';
  
  IF recent_events_count > 4 THEN
    RETURN QUERY SELECT true, 'Excessive clock events in short time period';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT false, 'No suspicious activity detected';
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Update timestamps trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_project_locations_updated_at
  BEFORE UPDATE ON project_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log suspicious activity
CREATE OR REPLACE FUNCTION log_suspicious_clock_event()
RETURNS TRIGGER AS $$
DECLARE
  suspicious_check RECORD;
BEGIN
  -- Check for suspicious activity
  SELECT * INTO suspicious_check 
  FROM check_suspicious_activity(NEW.worker_id, NEW.project_id);
  
  IF suspicious_check.is_suspicious THEN
    -- Log the violation
    PERFORM log_security_violation(
      NEW.worker_id,
      'suspicious_activity',
      suspicious_check.reason,
      NEW.device_info,
      (NEW.device_info->>'location')::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_suspicious_activity
  AFTER INSERT ON clock_events
  FOR EACH ROW
  EXECUTE FUNCTION log_suspicious_clock_event(); 