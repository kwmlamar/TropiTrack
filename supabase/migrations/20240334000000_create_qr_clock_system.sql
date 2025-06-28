-- Create QR code clock in/out system
-- This migration adds tables and functionality for QR code-based time tracking

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
-- PROJECT LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8), -- GPS latitude coordinate
  longitude DECIMAL(11, 8), -- GPS longitude coordinate
  radius_meters INTEGER DEFAULT 50, -- Acceptable scanning radius in meters (default 50m)
  qr_code_id UUID UNIQUE, -- Will be set when QR code is generated
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QR CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL,
  code_hash VARCHAR(255) UNIQUE NOT NULL, -- Unique hash for the QR code
  name VARCHAR(255) NOT NULL,
  description TEXT,
  qr_type VARCHAR(50) NOT NULL CHECK (qr_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLOCK EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clock_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_location_id UUID REFERENCES project_locations(id) ON DELETE SET NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB, -- Store device fingerprint, GPS coordinates, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Project locations indexes
CREATE INDEX IF NOT EXISTS idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_company_id ON project_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_qr_code_id ON project_locations(qr_code_id);

-- QR codes indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_company_id ON qr_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_project_location_id ON qr_codes(project_location_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code_hash ON qr_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);

-- Clock events indexes
CREATE INDEX IF NOT EXISTS idx_clock_events_worker_id ON clock_events(worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_project_id ON clock_events(project_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_company_id ON clock_events(company_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_event_time ON clock_events(event_time);
CREATE INDEX IF NOT EXISTS idx_clock_events_worker_date ON clock_events(worker_id, event_time);
CREATE INDEX IF NOT EXISTS idx_clock_events_qr_code_id ON clock_events(qr_code_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events ENABLE ROW LEVEL SECURITY;

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
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert clock events for their company" ON clock_events
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

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

-- Function to get worker's current clock status
CREATE OR REPLACE FUNCTION get_worker_clock_status(worker_uuid UUID, project_uuid UUID)
RETURNS TABLE(
  last_event_type VARCHAR(50),
  last_event_time TIMESTAMP WITH TIME ZONE,
  is_clocked_in BOOLEAN,
  current_break_start TIMESTAMP WITH TIME ZONE
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
      MAX(CASE WHEN event_type = 'clock_out' AND rn = 1 THEN event_time END) as last_clock_out,
      MAX(CASE WHEN event_type = 'break_start' AND rn = 1 THEN event_time END) as last_break_start,
      MAX(CASE WHEN event_type = 'break_end' AND rn = 1 THEN event_time END) as last_break_end
    FROM last_events
  )
  SELECT 
    CASE 
      WHEN last_clock_in > COALESCE(last_clock_out, '1900-01-01'::timestamp) THEN 'clock_in'
      WHEN last_break_start > COALESCE(last_break_end, '1900-01-01'::timestamp) THEN 'break_start'
      ELSE 'clock_out'
    END as last_event_type,
    GREATEST(last_clock_in, last_clock_out, last_break_start, last_break_end) as last_event_time,
    last_clock_in > COALESCE(last_clock_out, '1900-01-01'::timestamp) as is_clocked_in,
    CASE 
      WHEN last_break_start > COALESCE(last_break_end, '1900-01-01'::timestamp) THEN last_break_start
      ELSE NULL
    END as current_break_start
  FROM clock_status;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Update timestamps
CREATE TRIGGER update_project_locations_updated_at
  BEFORE UPDATE ON project_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE project_locations IS 'Stores physical locations where workers can clock in/out using QR codes';
COMMENT ON TABLE qr_codes IS 'Stores QR codes that workers can scan to clock in/out';
COMMENT ON TABLE clock_events IS 'Stores all clock in/out events from QR code scans';
COMMENT ON COLUMN clock_events.device_info IS 'JSON object containing device fingerprint, GPS coordinates, IP address, etc.';
COMMENT ON COLUMN qr_codes.code_hash IS 'Unique hash that gets encoded in the QR code';
COMMENT ON COLUMN qr_codes.qr_type IS 'Type of action this QR code performs: clock_in, clock_out, break_start, break_end'; 