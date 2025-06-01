import { supabase } from "@/lib/supabaseClient"
import type { Invite, NewInvite, UpdateInvite, InviteFilters, InviteWithDetails } from "@/lib/types/invite"
import type { ApiResponse } from "@/lib/types"
import { randomBytes } from "crypto"
import { getProfile } from "./data"


/**
 * Get invites with optional filtering (company scoped)
 */
export async function getInvites(
  userId: string,
  filters: InviteFilters = {},
): Promise<ApiResponse<InviteWithDetails[]>> {
  const profile = await getProfile(userId)
  try {
    let query = supabase
      .from("invites")
      .select(`
        *,
        inviter:profiles!invited_by(id, first_name, last_name, email),
        accepter:profiles!accepted_by(id, first_name, last_name, email)
      `)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (filters.email) {
      query = query.eq("email", filters.email)
    }

    if (filters.role) {
      query = query.eq("role", filters.role)
    }

    if (filters.invited_by) {
      query = query.eq("invited_by", filters.invited_by)
    }

    if (filters.is_used !== undefined) {
      query = query.eq("is_used", filters.is_used)
    }

    if (filters.expired !== undefined) {
      const now = new Date().toISOString()
      if (filters.expired) {
        query = query.lt("expires_at", now)
      } else {
        query = query.gte("expires_at", now)
      }
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching invites:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as InviteWithDetails[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching invites:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get a single invite by ID (company scoped)
 */
export async function getInvite(companyId: string, id: string): Promise<ApiResponse<InviteWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("invites")
      .select(`
        *,
        inviter:profiles!invited_by(id, first_name, last_name, email),
        accepter:profiles!accepted_by(id, first_name, last_name, email)
      `)
      .eq("company_id", companyId)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as InviteWithDetails, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string): Promise<ApiResponse<InviteWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("invites")
      .select(`
        *,
        inviter:profiles!invited_by(id, first_name, last_name, email),
        accepter:profiles!accepted_by(id, first_name, last_name, email)
      `)
      .eq("token", token)
      .single()

    if (error) {
      console.error("Error fetching invite by token:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as InviteWithDetails, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching invite by token:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new invite
 */
export async function createInvite(invite: NewInvite): Promise<ApiResponse<Invite>> {
  try {
    // Generate a unique token
    const token = randomBytes(32).toString("hex")

    // Set expiration to 7 days from now if not provided
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const inviteData = {
      ...invite,
      token,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    }

    const { data, error } = await supabase.from("invites").insert([inviteData]).select().single()

    if (error) {
      console.error("Error creating invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Invite, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update an existing invite (company scoped)
 */
export async function updateInvite(companyId: string, id: string, invite: UpdateInvite): Promise<ApiResponse<Invite>> {
  try {
    const { data, error } = await supabase
      .from("invites")
      .update(invite)
      .eq("company_id", companyId)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Invite, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Accept an invite
 */
export async function acceptInvite(token: string, acceptedBy: string): Promise<ApiResponse<Invite>> {
  try {
    const { data, error } = await supabase
      .from("invites")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: acceptedBy,
        is_used: true,
      })
      .eq("token", token)
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .select()
      .single()

    if (error) {
      console.error("Error accepting invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Invite, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error accepting invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete an invite (company scoped)
 */
export async function deleteInvite(userId: string, id: string): Promise<ApiResponse<boolean>> {
    const profile = await getProfile(userId);
  try {
    const { error } = await supabase.from("invites").delete().eq("company_id", profile.company_id).eq("id", id)

    if (error) {
      console.error("Error deleting invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Resend an invite (creates new token and extends expiration)
 */
export async function resendInvite(userId: string, id: string): Promise<ApiResponse<Invite>> {
    const profile = await getProfile(userId);
  try {
    const newToken = randomBytes(32).toString("hex")
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from("invites")
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        is_used: false,
      })
      .eq("company_id", profile.company_id)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error resending invite:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Invite, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error resending invite:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
