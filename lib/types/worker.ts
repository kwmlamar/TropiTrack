// Worker types
export interface Worker {
  id: string
  company_id?: string
  user_id?: string
  name: string
  email?: string 
  phone?: string 
  position: string
  hourly_rate: number
  overtime_rate?: number
  hire_date: string
  termination_date?: string
  address?: string 
  emergency_contact?: string 
  emergency_phone?: string 
  skills?: string[]
  certifications?: string[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  department?: string
  nib_number?: string
  // Biometric fields
  biometric_enrolled?: boolean
  biometric_enrollment_date?: string
  biometric_type?: 'fingerprint' | 'face' | 'both' | 'none'
  biometric_device_id?: string
  biometric_template_hash?: string
}

export type NewWorker = Omit<Worker, "id" | "created_at" | "updated_at"> & {
  is_active?: boolean
  skills?: string[]
  certifications?: string[]
}

export type UpdateWorker = Partial<Omit<Worker, "id" | "created_at" | "updated_at">>

export type WorkerFilters = {
  company_id?: string
  role?: string
  is_active?: boolean
  search?: string
  skills?: string[]
  created_by?: string
  limit?: number
  offset?: number
}

export type WorkerWithDetails = Worker & {
  current_projects?: {
    project: {
      id: string
      name: string
    }
    role_on_project?: string
  }[]
  _count?: {
    timesheets: number
    project_assignments: number
  }
}

// Biometric enrollment types
export interface BiometricEnrollment {
  id: string
  worker_id: string
  company_id: string
  enrollment_type: 'fingerprint' | 'face' | 'both'
  device_id: string
  template_hash: string
  enrollment_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type NewBiometricEnrollment = Omit<BiometricEnrollment, "id" | "created_at" | "updated_at">

export interface BiometricEnrollmentStatus {
  worker_id: string
  is_enrolled: boolean
  enrollment_type: 'fingerprint' | 'face' | 'both' | 'none'
  enrollment_date?: string
  last_verification?: string
  device_compatibility: {
    fingerprint: boolean
    face: boolean
    webauthn: boolean
  }
}
