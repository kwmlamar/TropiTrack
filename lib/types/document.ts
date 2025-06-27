export interface ProjectDocument {
  id: string
  project_id: string
  company_id: string
  name: string
  description?: string
  file_path: string
  file_size: number
  file_type: string
  category: DocumentCategory
  uploaded_by: string
  created_at: string
  updated_at: string
  // Joined fields
  uploaded_by_profile?: {
    name: string
    email: string
  }
}

export type DocumentCategory = 
  | 'contract'
  | 'permit'
  | 'plan'
  | 'invoice'
  | 'receipt'
  | 'specification'
  | 'safety'
  | 'quality'
  | 'other'

export type NewProjectDocument = Omit<ProjectDocument, 'id' | 'created_at' | 'updated_at'>

export type UpdateProjectDocument = Partial<Omit<ProjectDocument, 'id' | 'project_id' | 'company_id' | 'uploaded_by' | 'created_at' | 'updated_at'>>

export interface DocumentUploadData {
  name: string
  description?: string
  category: DocumentCategory
  file: File
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; description: string }[] = [
  {
    value: 'contract',
    label: 'Contract',
    description: 'Project contracts and agreements'
  },
  {
    value: 'permit',
    label: 'Permit',
    description: 'Building permits and licenses'
  },
  {
    value: 'plan',
    label: 'Plan',
    description: 'Architectural and engineering plans'
  },
  {
    value: 'invoice',
    label: 'Invoice',
    description: 'Project invoices and billing'
  },
  {
    value: 'receipt',
    label: 'Receipt',
    description: 'Expense receipts and records'
  },
  {
    value: 'specification',
    label: 'Specification',
    description: 'Technical specifications and requirements'
  },
  {
    value: 'safety',
    label: 'Safety',
    description: 'Safety documentation and procedures'
  },
  {
    value: 'quality',
    label: 'Quality',
    description: 'Quality control and inspection reports'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Miscellaneous project documents'
  }
]

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈'
  if (fileType.includes('zip') || fileType.includes('archive')) return '📦'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 