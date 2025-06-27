-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('contract', 'permit', 'plan', 'invoice', 'receipt', 'specification', 'safety', 'quality', 'other'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at DESC);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read files if they are assigned to the project or are admins
CREATE POLICY "Users can read project files if assigned to project" ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = project_files.project_id
      AND pa.worker_id = auth.uid()
      AND pa.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Users can insert files if they are assigned to the project or are admins
CREATE POLICY "Users can upload files if assigned to project" ON project_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = project_files.project_id
      AND pa.worker_id = auth.uid()
      AND pa.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Users can update files if they uploaded them or are admins
CREATE POLICY "Users can update files they uploaded or if admin" ON project_files
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Users can delete files if they uploaded them or are admins
CREATE POLICY "Users can delete files they uploaded or if admin" ON project_files
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project_documents',
  'project_documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project_documents bucket
-- Users can upload files if they are assigned to the project or are admins
CREATE POLICY "Users can upload project documents if assigned to project" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project_documents'
    AND (
      EXISTS (
        SELECT 1 FROM project_assignments pa
        JOIN projects p ON p.id = pa.project_id
        WHERE pa.worker_id = auth.uid()
        AND pa.is_active = true
        AND (storage.foldername(name))[1] = p.id::text
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
      )
    )
  );

-- Users can read files if they are assigned to the project or are admins
CREATE POLICY "Users can read project documents if assigned to project" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project_documents'
    AND (
      EXISTS (
        SELECT 1 FROM project_assignments pa
        JOIN projects p ON p.id = pa.project_id
        WHERE pa.worker_id = auth.uid()
        AND pa.is_active = true
        AND (storage.foldername(name))[1] = p.id::text
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
      )
    )
  );

-- Users can delete files if they uploaded them or are admins
CREATE POLICY "Users can delete project documents if they uploaded or are admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project_documents'
    AND (
      owner = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
      )
    )
  ); 