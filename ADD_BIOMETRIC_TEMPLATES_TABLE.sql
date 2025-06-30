-- Create biometric_templates table for cross-device biometric authentication
-- Run this script in your Supabase SQL Editor

-- Create the biometric_templates table
CREATE TABLE IF NOT EXISTS biometric_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('fingerprint', 'face', 'both')),
  template_data TEXT NOT NULL, -- Base64 encoded biometric template
  template_features JSONB NOT NULL, -- Extracted biometric features
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  algorithm_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  capture_device VARCHAR(100),
  capture_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_biometric_templates_worker_id ON biometric_templates(worker_id);
CREATE INDEX IF NOT EXISTS idx_biometric_templates_company_id ON biometric_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_biometric_templates_type ON biometric_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_biometric_templates_active ON biometric_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_templates_worker_type ON biometric_templates(worker_id, template_type);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_biometric_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_biometric_templates_updated_at
  BEFORE UPDATE ON biometric_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_templates_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE biometric_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see templates for workers in their company
CREATE POLICY "Users can view biometric templates for their company workers" ON biometric_templates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert templates for workers in their company
CREATE POLICY "Users can insert biometric templates for their company workers" ON biometric_templates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update templates for workers in their company
CREATE POLICY "Users can update biometric templates for their company workers" ON biometric_templates
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete templates for workers in their company
CREATE POLICY "Users can delete biometric templates for their company workers" ON biometric_templates
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE biometric_templates IS 'Stores cross-device biometric templates for worker authentication';
COMMENT ON COLUMN biometric_templates.template_data IS 'Base64 encoded biometric template data';
COMMENT ON COLUMN biometric_templates.template_features IS 'JSON array of extracted biometric features for matching';
COMMENT ON COLUMN biometric_templates.quality_score IS 'Template quality score (0-100) indicating capture quality';

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'biometric_templates' 
ORDER BY ordinal_position; 