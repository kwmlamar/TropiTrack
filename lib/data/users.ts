import { supabase } from "@/lib/supabaseClient"
import type { User, NewUser, UpdateUser, UserFilters, UserWithDetails } from "@/lib/types/user"
import type { ApiResponse } from "@/lib/types"
import { escapeSearchTerm } from "@/lib/utils"

/**
 * Get users with optional filtering (company scoped)
 */
export async function getUsers(companyId: string, filters: UserFilters = {}): Promise<ApiResponse<UserWithDetails[]>> {
  try {
    let query = supabase
      .from("users")
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (filters.role) {
      query = query.eq("role", filters.role)
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters.search) {
      // Escape special characters that could cause PostgreSQL parsing errors
      const escapedSearch = escapeSearchTerm(filters.search)
      
      query = query.or(
        `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`,
      )
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as UserWithDetails[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching users:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get a single user by ID (company scoped)
 */
export async function getUser(companyId: string, id: string): Promise<ApiResponse<UserWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        company:companies(id, name)
      `)
      .eq("company_id", companyId)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as UserWithDetails, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching user:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new user
 */
export async function createUser(user: NewUser): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase.from("users").insert([user]).select().single()

    if (error) {
      console.error("Error creating user:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as User, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating user:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update an existing user (company scoped)
 */
export async function updateUser(companyId: string, id: string, user: UpdateUser): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(user)
      .eq("company_id", companyId)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as User, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating user:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a user (company scoped)
 */
export async function deleteUser(companyId: string, id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("users").delete().eq("company_id", companyId).eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting user:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateUserLastLogin(id: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user last login:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as User, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating user last login:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
