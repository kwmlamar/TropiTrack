// Project types
export interface Project {
  id: string
  company_id?: string
  client_id: string
  name: string
  description?: string
  location?: string
  start_date: string | null
  end_date?: string | null
  estimated_end_date?: string
  budget?: number
  status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  project_manager_id?: string
  notes?: string
  is_active?: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export type NewProject = Omit<Project, "id" | "created_at" | "updated_at"> & {
  status?: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  is_active?: boolean
}

export type UpdateProject = Partial<Omit<Project, "id" | "created_at" | "updated_at">>

export type ProjectFilters = {
  company_id?: string
  client_id?: string
  status?: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  project_manager_id?: string
  is_active?: boolean
  search?: string
  limit?: number
  offset?: number
}

export type ProjectWithDetails = Project & {
  client?: {
    id: string
    name: string
    company?: string
  }
  project_manager?: {
    id: string
    first_name?: string
    last_name?: string
  }
  assigned_workers?: {
    id: string
    name: string
    role: string
  }[]
  _count?: {
    time_entries: number
    assigned_workers: number
  }
}
