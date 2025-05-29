// Worker types
export interface Worker {
  id: string
  company_id?: string
  user_id?: string
  name: string
  email?: string | null
  phone?: string | null
  role: string
  hourly_rate: number
  overtime_rate?: number
  hire_date: string
  termination_date?: string
  address?: string | null
  emergency_contact?: string | null
  emergency_phone?: string | null
  skills?: string[]
  certifications?: string[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
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
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  current_projects?: {
    id: string
    name: string
    role_on_project?: string
  }[]
  _count?: {
    time_entries: number
    project_assignments: number
  }
}
