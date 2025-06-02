// Invite types
export interface Invite {
  id: string
  company_id: string
  email: string
  role: "admin" | "manager" | "employee"
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  accepted_by?: string
  is_used: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
  created_at: string
}

export type NewInvite = Omit<Invite, "id" | "created_at" | "token" | "is_used"> & {
  role?: "admin" | "manager" | "employee"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export type UpdateInvite = Partial<Omit<Invite, "id" | "created_at" | "token">>

export type InviteFilters = {
  company_id?: string
  email?: string
  role?: "admin" | "manager" | "employee"
  invited_by?: string
  is_used?: boolean
  expired?: boolean
  limit?: number
  offset?: number
}

export type InviteWithDetails = Invite & {
  inviter?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  accepter?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}
