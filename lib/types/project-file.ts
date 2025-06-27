export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  original_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_by: string
  uploaded_at: string
  description?: string
  category: FileCategory
  uploaded_by_profile?: {
    id: string
    name: string
    email: string
  }
}

export type FileCategory = 'contract' | 'permit' | 'plan' | 'invoice' | 'receipt' | 'specification' | 'safety' | 'quality' | 'other'

export interface FileUploadData {
  file: File
  name: string
  description?: string
  category: FileCategory
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export const FILE_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'permit', label: 'Permit' },
  { value: 'plan', label: 'Plan' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'specification', label: 'Specification' },
  { value: 'safety', label: 'Safety' },
  { value: 'quality', label: 'Quality' },
  { value: 'other', label: 'Other' }
] as const

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB 