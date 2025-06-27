import { supabase } from '@/lib/supabaseClient'
import { ProjectFile, FileCategory, FileUploadData } from '@/lib/types/project-file'

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files')
    .select(`
      *,
      uploaded_by_profile:profiles!project_files_uploaded_by_fkey(
        id,
        name,
        email
      )
    `)
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching project files:', error)
    throw new Error('Failed to fetch project files')
  }

  return data || []
}

export async function uploadProjectFile(
  projectId: string,
  uploadData: FileUploadData
): Promise<ProjectFile> {
  // Create FormData for file upload
  const formData = new FormData()
  formData.append('projectId', projectId)
  formData.append('name', uploadData.name)
  formData.append('description', uploadData.description || '')
  formData.append('category', uploadData.category)
  formData.append('file', uploadData.file)

  // Upload file using the API route
  const response = await fetch('/api/project-files', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to upload file')
  }

  const result = await response.json()
  return result.data
}

export async function deleteProjectFile(fileId: string): Promise<void> {
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', fileId)

  if (error) {
    console.error('Error deleting project file:', error)
    throw new Error('Failed to delete project file')
  }
}

export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('project_documents')
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw new Error('Failed to create signed URL')
  }

  return data.signedUrl
}

export async function updateProjectFile(
  fileId: string,
  updates: {
    name?: string
    description?: string
    category?: FileCategory
  }
): Promise<ProjectFile> {
  const { data, error } = await supabase
    .from('project_files')
    .update(updates)
    .eq('id', fileId)
    .select(`
      *,
      uploaded_by_profile:profiles!project_files_uploaded_by_fkey(
        id,
        name,
        email
      )
    `)
    .single()

  if (error) {
    console.error('Error updating project file:', error)
    throw new Error('Failed to update project file')
  }

  return data
}

export async function getProjectFileStats(projectId: string): Promise<{
  total: number
  byCategory: Record<string, number>
  totalSize: number
}> {
  const { data, error } = await supabase
    .from('project_files')
    .select('category, file_size')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching project file stats:', error)
    throw new Error('Failed to fetch project file stats')
  }

  const stats = {
    total: data?.length || 0,
    byCategory: {} as Record<string, number>,
    totalSize: 0
  }

  data?.forEach(file => {
    stats.totalSize += file.file_size || 0
    stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1
  })

  return stats
} 