import type {
  Project,
  NewProject,
  UpdateProject,
  ProjectFilters,
  ProjectWithDetails,
} from "@/lib/types/project";
import type { ApiResponse } from "@/lib/types";
import { getProfile } from "./data";
import { escapeSearchTerm } from "@/lib/utils";

import { supabase } from "@/lib/supabaseClient"

/**
 * Get projects with optional filtering (company scoped)
 */
export async function getProjects(
  companyId: string,
  filters: ProjectFilters = {}
): Promise<ApiResponse<ProjectWithDetails[]>> {
  try {
    let query = supabase
      .from("projects")
      .select(
        `
        *,
        client:clients(id, name, company),
        assigned_workers:project_assignments(
          worker:workers(id, name, role)
        ),
        _count:timesheets(count)
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (filters.client_id) {
      query = query.eq("client_id", filters.client_id);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters.project_manager_id) {
      query = query.eq("project_manager_id", filters.project_manager_id);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.search) {
      // Escape special characters that could cause PostgreSQL parsing errors
      const escapedSearch = escapeSearchTerm(filters.search);
      
      query = query.or(
        `name.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as ProjectWithDetails[], error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching projects:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Get a single project by ID (company scoped)
 */
export async function getProject(
  companyId: string,
  id: string
): Promise<ApiResponse<ProjectWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        client:clients(id, name, company),
        assigned_workers:project_assignments(
          worker:workers(id, name, role)
        ),
        _count:timesheets(count)
      `
      )
      .eq("company_id", companyId)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as ProjectWithDetails, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching project:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  project: NewProject
): Promise<ApiResponse<Project>> {
  const profile = await getProfile(userId);
  try {
    // Check project limit before creating
    const { data: existingProjects, error: countError } = await supabase
      .from("projects")
      .select("id", { count: "exact" })
      .eq("company_id", profile.company_id);

    if (countError) {
      console.error("Error checking project count:", countError);
      return { data: null, error: "Failed to check project limit", success: false };
    }

    const currentProjectCount = existingProjects?.length || 0;

    // Get subscription limits
    const { data: subscription } = await supabase
      .from("company_subscriptions")
      .select(`
        subscription_plans!inner(
          limits
        )
      `)
      .eq("company_id", profile.company_id)
      .in("status", ["active", "trialing"])
      .single();

    let projectLimit = 2; // Default limit for no subscription
    if (subscription?.subscription_plans?.limits) {
      const limits = subscription.subscription_plans.limits;
      // Handle different field names in limits
      projectLimit = typeof limits.projects === 'number' ? limits.projects :
                    typeof limits.projects_limit === 'number' ? limits.projects_limit : 2;
      
      // Fix for old starter plan data - if it's the starter plan with wrong limits, override them
      if (subscription.subscription_plans.slug === 'starter') {
        if (projectLimit === 20) {
          projectLimit = 3;
        }
      }
    }

    // Check if limit is exceeded (allow unlimited if limit is -1)
    if (projectLimit !== -1 && currentProjectCount >= projectLimit) {
      return { 
        data: null, 
        error: `You've reached your limit of ${projectLimit} projects. Upgrade your plan to add more.`, 
        success: false 
      };
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, company_id: profile.company_id, created_by: userId }])
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as Project, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error creating project:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Update an existing project (company scoped)
 */
export async function updateProject(
  userId: string,
  id: string,
  project: UpdateProject
): Promise<ApiResponse<Project>> {
    const profile = await getProfile(userId);
  try {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("company_id", profile.company_id)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as Project, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error updating project:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Delete a project (company scoped)
 */
export async function deleteProject(
  companyId: string,
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) {
      console.error("Error deleting project:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error deleting project:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Get projects created within a date range (for dashboard statistics)
 */
export async function getProjectsByDateRange(
  companyId: string,
  dateFrom: string,
  dateTo: string,
  filters: ProjectFilters = {}
): Promise<ApiResponse<ProjectWithDetails[]>> {
  try {
    let query = supabase
      .from("projects")
      .select(
        `
        *,
        client:clients(id, name, company),
        assigned_workers:project_assignments(
          worker:workers(id, name, role)
        ),
        _count:timesheets(count)
      `
      )
      .eq("company_id", companyId)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching projects by date range:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as ProjectWithDetails[], error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching projects by date range:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Get active projects count for a date range (for dashboard statistics)
 * This counts projects that were active during the specified period
 */
export async function getActiveProjectsCount(
  companyId: string,
  dateFrom: string,
  dateTo: string,
  filters: ProjectFilters = {}
): Promise<ApiResponse<number>> {
  try {
    let query = supabase
      .from("projects")
      .select("id, is_active, created_at, status")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .lte("created_at", dateTo)

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching active projects count:", error);
      return { data: null, error: error.message, success: false };
    }

    // Filter projects that were active during the specified period
    const activeProjects = data?.filter(project => {
      const createdDate = new Date(project.created_at)
      const periodEnd = new Date(dateTo)

      // Project was created before or during the period
      const wasCreatedBeforePeriod = createdDate <= periodEnd
      
      // Project is still active (no end date or end date is after period start)
      const isStillActive = project.status !== "completed" && project.status !== "cancelled"

      return wasCreatedBeforePeriod && isStillActive
    }) || []

    return { data: activeProjects.length, error: null, success: true };
  } catch (error) {
    console.error("Unexpected error fetching active projects count:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}
