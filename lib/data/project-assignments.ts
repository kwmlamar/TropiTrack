import { createClient } from "@supabase/supabase-js"
import type {
  ProjectAssignment,
  NewProjectAssignment,
  UpdateProjectAssignment,
  ProjectAssignmentFilters,
  ProjectAssignmentWithDetails,
} from "@/lib/types/project-assignment"
import type { ApiResponse } from "@/lib/types"
import { getProfile } from "./data"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// fetch project assignments
export async function fetchProjectAssignments(userId: string) {
  const profile = await getProfile(userId);

  const { data, error } = await supabase
    .from("project_assignments")
    .select("*")
    .eq("company_id", profile.company_id);

  if (error || !data) {
    throw new Error("Error fetching project assignments:" + error.message);
  }

  return data;
}

/**
 * Get project assignments with optional filtering (company scoped)
 */
export async function getProjectAssignments(
  companyId: string,
  filters: ProjectAssignmentFilters = {},
): Promise<ApiResponse<ProjectAssignmentWithDetails[]>> {
  try {
    let query = supabase
      .from("project_assignments")
      .select(`
        *,
        project:projects(id, name, status),
        worker:workers(id, name, role)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id)
    }

    if (filters.worker_id) {
      query = query.eq("worker_id", filters.worker_id)
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active)
    }

    if (filters.assigned_date_from) {
      query = query.gte("assigned_date", filters.assigned_date_from)
    }

    if (filters.assigned_date_to) {
      query = query.lte("assigned_date", filters.assigned_date_to)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching project assignments:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectAssignmentWithDetails[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project assignments:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get a single project assignment by ID (company scoped)
 */
export async function getProjectAssignment(
  companyId: string,
  id: string,
): Promise<ApiResponse<ProjectAssignmentWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("project_assignments")
      .select(`
        *,
        project:projects(id, name, status),
        worker:workers(id, name, role)
      `)
      .eq("company_id", companyId)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching project assignment:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectAssignmentWithDetails, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project assignment:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new project assignment
 */
export async function createProjectAssignment(
  assignment: NewProjectAssignment,
): Promise<ApiResponse<ProjectAssignment>> {
  try {
    const { data, error } = await supabase.from("project_assignments").insert([assignment]).select().single()

    if (error) {
      console.error("Error creating project assignment:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectAssignment, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating project assignment:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update an existing project assignment (company scoped)
 */
export async function updateProjectAssignment(
  companyId: string,
  id: string,
  assignment: UpdateProjectAssignment,
): Promise<ApiResponse<ProjectAssignment>> {
  try {
    const { data, error } = await supabase
      .from("project_assignments")
      .update(assignment)
      .eq("company_id", companyId)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating project assignment:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectAssignment, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating project assignment:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a project assignment (company scoped)
 */
export async function deleteProjectAssignment(companyId: string, id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("project_assignments").delete().eq("company_id", companyId).eq("id", id)

    if (error) {
      console.error("Error deleting project assignment:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting project assignment:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Assign multiple workers to a project
 */
export async function assignWorkersToProject(
  userId: string,
  projectId: string,
  workerIds: string[],
  roleOnProject?: string,
  hourlyRate?: number,
  createdBy?: string,
): Promise<ApiResponse<ProjectAssignment[]>> {
  const profile = await getProfile(userId);
  try {
    const assignments: NewProjectAssignment[] = workerIds.map((workerId) => ({
      company_id: profile.company_id,
      project_id: projectId,
      worker_id: workerId,
      assigned_date: new Date().toISOString().split("T")[0],
      role_on_project: roleOnProject,
      hourly_rate: hourlyRate,
      is_active: true,
      created_by: createdBy,
    }))

    const { data, error } = await supabase.from("project_assignments").insert(assignments).select()

    if (error) {
      console.error("Error assigning workers to project:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectAssignment[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error assigning workers to project:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Unassign a worker from a project
 */
export async function unassignWorkerFromProject(
  userId: string,
  projectId: string,
  workerId: string,
): Promise<ApiResponse<boolean>> {
  const profile = await getProfile(userId);
  try {
    const { error } = await supabase
      .from("project_assignments")
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split("T")[0],
      })
      .eq("company_id", profile.company_id)
      .eq("project_id", projectId)
      .eq("worker_id", workerId)
      .eq("is_active", true)

    if (error) {
      console.error("Error unassigning worker from project:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error unassigning worker from project:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
