import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types/project";
import { getProfile } from "./data";

interface RecentProjectResult {
  project_id: string;
  project: {
    id: string;
    name: string;
    status: Project['status'];
    location?: string;
    client_id: string;
    start_date: string;
    created_at: string;
    updated_at: string;
    client: {
      name: string;
    }[];
  };
}

/**
 * Get recent projects for a user
 */
export async function getRecentProjects(userId: string): Promise<Partial<Project>[]> {
  const profile = await getProfile(userId);

  const { data, error } = await supabase
    .from("recent_projects")
    .select(`
      project_id,
      project:projects(
        id,
        name,
        status,
        location,
        client_id,
        start_date,
        created_at,
        updated_at,
        client:clients(name)
      )
    `)
    .eq("user_id", userId)
    .eq("company_id", profile.company_id)
    .order("last_accessed", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent projects:", error);
    return [];
  }

  const typedData = data as unknown as RecentProjectResult[];
  return typedData.map(item => ({
    ...item.project,
    client_name: item.project.client?.[0]?.name
  }));
}

/**
 * Add or update a project in the user's recent projects list
 */
export async function updateRecentProject(userId: string, projectId: string): Promise<void> {
  try {
    const profile = await getProfile(userId);

    // First try to update existing record
    const { data: existingRecord, error: lookupError } = await supabase
      .from("recent_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("Error checking for existing recent project:", lookupError);
      return;
    }

    if (existingRecord) {
      // Update last_accessed timestamp
      const { error: updateError } = await supabase
        .from("recent_projects")
        .update({ last_accessed: new Date().toISOString() })
        .eq("id", existingRecord.id);

      if (updateError) {
        console.error("Error updating recent project:", updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("recent_projects")
        .insert({
          user_id: userId,
          company_id: profile.company_id,
          project_id: projectId,
        });

      if (insertError) {
        console.error("Error inserting recent project:", insertError);
      }
    }
  } catch (error) {
    console.error("Error in updateRecentProject:", error);
  }
} 