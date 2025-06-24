// Project Assignment types
export interface ProjectAssignment {
  id: string
  company_id: string
  project_id: string
  worker_id: string
  assigned_date: string
  unassigned_date?: string
  role_on_project?: string
  hourly_rate?: number
  is_active: boolean
  created_at: string
  created_by?: string
}

export type NewProjectAssignment = Omit<ProjectAssignment, "id" | "created_at" | "company_id"> & {
  assigned_date?: string
  is_active?: boolean
}

export type UpdateProjectAssignment = Partial<Omit<ProjectAssignment, "id" | "created_at">>

export type ProjectAssignmentFilters = {
  company_id?: string
  project_id?: string
  worker_id?: string
  is_active?: boolean
  assigned_date_from?: string
  assigned_date_to?: string
  limit?: number
  offset?: number
}

export type ProjectAssignmentWithDetails = ProjectAssignment & {
  project?: {
    id: string
    name: string
    status: string
  }
  worker?: {
    id: string
    name: string
    position: string
    hourly_rate?: number
  }
}
