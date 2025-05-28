// Client types
export interface Client {
  id: string
  company_id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  company?: string
  notes?: string
  is_active?: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export type NewClient = Omit<Client, "id" | "created_at" | "updated_at"> & {
  is_active?: boolean
}

export type UpdateClient = Partial<Omit<Client, "id" | "created_at" | "updated_at">>

export type ClientFilters = {
  company_id?: string
  is_active?: boolean
  search?: string
  created_by?: string
  limit?: number
  offset?: number
}

export type ClientWithDetails = Client & {
  projects?: {
    id: string
    name: string
    status: string
  }[]
  _count?: {
    projects: number
  }
}
