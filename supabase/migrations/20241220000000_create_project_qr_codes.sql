-- Create project_qr_codes table
CREATE TABLE IF NOT EXISTS project_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_description TEXT,
  qr_code_data TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_qr_codes_project_id ON project_qr_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_qr_codes_created_by ON project_qr_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_project_qr_codes_is_active ON project_qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_project_qr_codes_qr_code_data ON project_qr_codes(qr_code_data);

-- Enable RLS
ALTER TABLE project_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view QR codes for their company projects" ON project_qr_codes
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_profiles up ON p.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create QR codes for their company projects" ON project_qr_codes
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_profiles up ON p.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update QR codes for their company projects" ON project_qr_codes
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_profiles up ON p.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete QR codes for their company projects" ON project_qr_codes
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN user_profiles up ON p.company_id = up.company_id
      WHERE up.user_id = auth.uid()
    )
  );

-- Create function to update usage count when QR code is scanned
CREATE OR REPLACE FUNCTION update_qr_code_usage(qr_data TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE project_qr_codes 
  SET 
    usage_count = usage_count + 1,
    last_used = NOW()
  WHERE qr_code_data = qr_data AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_qr_code_usage(TEXT) TO authenticated;
