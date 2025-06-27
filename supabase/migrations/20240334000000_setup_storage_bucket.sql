-- Create storage bucket for project documents if it doesn't exist
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