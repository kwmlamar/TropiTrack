-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'other',
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_company_id ON project_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON project_documents(category);
CREATE INDEX IF NOT EXISTS idx_project_documents_uploaded_by ON project_documents(uploaded_by);

-- Add RLS policies
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view documents for projects in their company
CREATE POLICY "Users can view project documents for their company" ON project_documents
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy to allow users to insert documents for projects in their company
CREATE POLICY "Users can insert project documents for their company" ON project_documents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy to allow users to update documents they uploaded
CREATE POLICY "Users can update project documents they uploaded" ON project_documents
  FOR UPDATE USING (
    uploaded_by = auth.uid() AND
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy to allow users to delete documents they uploaded
CREATE POLICY "Users can delete project documents they uploaded" ON project_documents
  FOR DELETE USING (
    uploaded_by = auth.uid() AND
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE project_documents IS 'Stores documents associated with construction projects';
COMMENT ON COLUMN project_documents.category IS 'Document category: contract, permit, plan, invoice, receipt, other';
COMMENT ON COLUMN project_documents.file_path IS 'Path to the stored file in Supabase Storage';
COMMENT ON COLUMN project_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN project_documents.file_type IS 'MIME type of the file';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_documents_updated_at
  BEFORE UPDATE ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 