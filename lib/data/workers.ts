import type { Worker, NewWorker, UpdateWorker, WorkerFilters, WorkerWithDetails } from "@/lib/types/worker"
import type { ApiResponse } from "@/lib/types" 
import { getProfile } from "./data"

import { supabase } from "@/lib/supabaseClient"

/**
 * Get workers with optional filtering (company scoped)
 */
export async function getWorkers(
  companyId: string,
  filters: WorkerFilters = {},
): Promise<ApiResponse<WorkerWithDetails[]>> {
  try {
    let query = supabase
      .from("workers")
      .select(`
        *,
        user:users(id, email, first_name, last_name),
        current_projects:project_assignments(
          project:projects(id, name),
          role_on_project
        ),
        _count:time_entries(count)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (filters.role) {
      query = query.eq("role", filters.role)
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters.created_by) {
      query = query.eq("created_by", filters.created_by)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains("skills", filters.skills)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,role.ilike.%${filters.search}%`)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching workers:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as WorkerWithDetails[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching workers:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get a single worker by ID (company scoped)
 */
export async function getWorker(companyId: string, id: string): Promise<ApiResponse<WorkerWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("workers")
      .select(`
        *,
        user:users!workers_user_id_fkey(id, email, first_name, last_name),
        current_projects:project_assignments(
          project:projects(id, name),
          role_on_project
        ),
        _count:timesheets(count)
      `)
      .eq("company_id", companyId)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching worker:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as WorkerWithDetails, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching worker:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new worker
 */
export async function createWorker(userId: string, worker: NewWorker): Promise<ApiResponse<Worker>> {
  const profile = await getProfile(userId)

  try {
    // Normalize empty email to null to avoid unique constraint issues
    const normalizedWorker = {
      ...worker,
      email: worker.email && worker.email.trim() !== "" ? worker.email.trim() : null,
    }

    const { data, error } = await supabase
      .from("workers")
      .insert([{ ...normalizedWorker, company_id: profile.company_id }]) 
      .select()
      .single()

    if (error) {
      console.error("Error creating worker:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Worker, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating worker:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}


/**
 * Update an existing worker (company scoped)
 */
export async function updateWorker(userId: string, id: string, worker: UpdateWorker): Promise<ApiResponse<Worker>> {
    const profile = await getProfile(userId);
  try {
    // Normalize empty email to null to avoid unique constraint issues
    const normalizedWorker = {
      ...worker,
      email: worker.email && worker.email.trim() !== "" ? worker.email.trim() : null,
    };

    const { data, error } = await supabase
      .from("workers")
      .update(normalizedWorker)
      .eq("company_id", profile.company_id)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating worker:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Worker, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating worker:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a worker (company scoped)
 */
export async function deleteWorker(companyId: string, id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("workers").delete().eq("company_id", companyId).eq("id", id)

    if (error) {
      console.error("Error deleting worker:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting worker:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get workers available for assignment to a project
 */
export async function getAvailableWorkers(companyId: string, projectId?: string): Promise<ApiResponse<Worker[]>> {
  try {
    let query = supabase.from("workers").select("*").eq("company_id", companyId).eq("is_active", true)

    if (projectId) {
      // Exclude workers already assigned to this project
      const { data: assignments } = await supabase
        .from("project_assignments")
        .select("worker_id")
        .eq("project_id", projectId)
        .eq("is_active", true)

      if (assignments && assignments.length > 0) {
        const assignedWorkerIds = assignments.map((a) => a.worker_id)
        query = query.not("id", "in", `(${assignedWorkerIds.join(",")})`)
      }
    }

    const { data, error } = await query.order("name")

    if (error) {
      console.error("Error fetching available workers:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as Worker[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching available workers:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
