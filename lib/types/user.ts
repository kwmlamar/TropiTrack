// User types
export interface User {
  id: string
  company_id: string
  email: string
  first_name?: string
  last_name?: string
  role: "admin" | "manager" | "employee"
  phone?: string
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export type NewUser = Omit<User, "id" | "created_at" | "updated_at" | "last_login_at"> & {
  role?: "admin" | "manager" | "employee"
  is_active?: boolean
}

export type UpdateUser = Partial<Omit<User, "id" | "created_at" | "updated_at">>

export type UserFilters = {
  company_id?: string
  role?: "admin" | "manager" | "employee"
  is_active?: boolean
  search?: string
  limit?: number
  offset?: number
}

export type UserWithDetails = User & {
  company?: {
    id: string
    name: string
  }
}
