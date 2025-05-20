import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { Worker, Client, Project, EntryMode } from "@/lib/types";
import { User } from "@supabase/supabase-js";

const supabase = await createBrowserClient();

// PROFILE INFO
export async function getProfile(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(
      "error fetching profile info: " + JSON.stringify(profileError)
    );
    console.log("user in fetchProfileInfo: ");
  }

  return profile;
}

// WORKERS

// Get all workers
export async function fetchWorkersForCompany({ user }: { user: User }) {
  const profile = await getProfile(user.id);

  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch worker: " + error.message);
  return data ?? [];
}

// Add new employee
export async function generateWorker(
  employeeData: {
    name: string;
    role?: string;
    hourly_rate: number;
    active?: boolean;
  },
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);
  const { data, error } = await supabase
    .from("workers")
    .insert({ ...employeeData, company_id: profile.company_id })
    .select() // this ensures data is returned
    .single();

  if (error) throw new Error("Failed to add worker: " + error.message);
  return data?.[0]; // return the inserted employee
}

// Delete an employee
export async function deleteEmployee(
  workerId: string,
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);
  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", workerId)
    .eq("company_id", profile.company_id);

  if (error) throw new Error("Failed to delete worker: " + error.message);
  return; // don't return `true` — just return nothing (void) on success
}

export async function updateEmployee(worker: Worker, { user }: { user: User }) {
  const profile = await getProfile(user.id);
  const { data, error } = await supabase
    .from("workers")
    .update({
      name: worker.name,
      hourly_rate: worker.hourly_rate,
      active: worker.active,
    })
    .eq("id", worker.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error) throw new Error("Failed to delete worker:" + error.message);
  if (!data) throw new Error("No data returned from updateWorker");
  return data;
}

// CLIENTS

// fetch Clients
export async function fetchClientsForCompany({ user }: { user: User }) {
  const profile = await getProfile(user.id);
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch clients:" + error.message);

  return data ?? [];
}

export async function generateClient(
  clientData: {
    name: string;
    email?: string;
  },
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);
  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        ...clientData,
        company_id: profile.company_id,
      },
    ])
    .select()
    .single();

  if (error) throw new Error("Failed to create new client:" + error.message);
  return data;
}

export async function deleteClient(clientId: string, { user }: { user: User }) {
  const profile = await getProfile(user.id);

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("company_id", profile.company_id);

  if (error) throw new Error("Failed to delete client" + error.message);
  return;
}

export async function updateClient(client: Client, { user }: { user: User }) {
  const profile = await getProfile(user.id);

  const { data, error } = await supabase
    .from("clients")
    .update({
      name: client.name,
      email: client.email,
    })
    .eq("id", client.id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error) throw new Error("Failed to update client:" + error.message);
  if (!data) throw new Error("No data returned from updateClient");
  return data;
}

// PROJECTS

export async function fetchProjectsForCompany({ user }: { user: User }) {
  const profile = await getProfile(user.id);

  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(id, name)")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error || !data)
    throw new Error("Failed to fetch projects:" + error.message);

  return data ?? [];
}

// fetch project assignments
export async function fetchProjectAssignments({ user }: { user: User }) {
  const profile = await getProfile(user.id);

  const { data, error } = await supabase
    .from("project_assignments")
    .select("*")
    .eq("company_id", profile.company_id);

  if (error || !data) {
    throw new Error("Error fetching project assignments:" + error.message);
  }

  return data;
}

export async function generateProject(
  projectData: Omit<Project, "id"> & {
    assigned_worker_ids: (string | number)[];
  },
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectData.name,
      client_id: projectData.client_id,
      company_id: profile.company_id,
      start_date: projectData.start_date,
      status: projectData.status,
    })
    .select()
    .single();

  if (projectError || !project)
    throw new Error(
      "Failed to insert project: " + (projectError?.message || "Unknown error")
    );

  const { data: projectAssignment, error: projectAssignmentError } =
    await supabase.from("project_assignments").insert(
      projectData.assigned_worker_ids.map((workerId) => ({
        project_id: project.id,
        worker_id: workerId,
        company_id: profile.company_id,
      }))
    );

  if (projectAssignmentError || !projectAssignment)
    throw new Error(
      "Failed to insert project assignments:" +
        projectAssignmentError?.message || "Unknown error"
    );

  return project;
}

export async function deleteProject(
  projectId: string,
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);

  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("company_id", profile.company_id)
    .eq("id", projectId)
    .select();

  if (error || !data) {
    throw new Error(
      "Error deleting project:" + (error?.message || "Unknown error")
    );
  }
  return true;
}

export async function updateProject(
  projectData: Project & {
    assigned_worker_ids: (string | number)[];
  },
  { user }: { user: User }
) {
  const profile = await getProfile(user.id);

  // Update the project details
  const { data: updatedProject, error: updateProjectError } = await supabase
    .from("projects")
    .update({
      name: projectData.name,
      client_id: projectData.client_id,
      company_id: profile.company_id,
      start_date: projectData.start_date,
      status: projectData.status,
    })
    .eq("id", projectData.id)
    .select()
    .single();

  if (updateProjectError || !updatedProject) {
    throw new Error(
      "Error updating project:" +
        (updateProjectError?.message || "Unknown error")
    );
  }

  // Delete existing assingments for the project
  const { error: deleteAssignmentsError } = await supabase
  .from("project_assignments")
  .delete()
  .eq("project_id", updatedProject.id);

  if (deleteAssignmentsError) {
    throw new Error(
      "Error deleting existing project assignments:" + 
      (deleteAssignmentsError?.message || "Unknown error")
    )
  }

  // Insert the updated assignments
  const assignments = projectData.assigned_worker_ids.map((workerId) => ({
    project_id: updatedProject.id,
    worker_id: workerId,
    company_id: profile.company_id,
  }));

  const { data: updatedAssignments, error: updateAssingmentsError } =
    await supabase.from("project_assignments").insert(assignments);

  if (updateAssingmentsError) {
    throw new Error(
      "Error updating project assignments:" +
        (updateAssingmentsError?.message || "Unknown error")
    );
  }
  return { project: updatedProject, assignments: updatedAssignments };
}

// USER PREFERENCES
export async function fetchPreferences(userId: string) {
  const { data, error} = await supabase
  .from("user_preferences")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  if (error) throw new Error("Failed to fetch user_preferences:" + error.message);

  return data;
}

import { VisibilityState} from "@tanstack/react-table";

export async function savePreferences(userId: string, columnVisibility: VisibilityState ) {
  const { data, error} = await supabase
  .from("user_preferences")
  .upsert({
    user_id: userId,
    column_visibility: columnVisibility,
    updated_at: new Date().toISOString(),
  }, 
  { onConflict: "user_id"}
);

  if (error) {
    console.error("Failed to save preferences:", error);
  }

  return data;
}

export async function updateEntryMode(userId: string, mode: EntryMode): Promise<EntryMode> {
  const { error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userId,
      entry_mode: mode,
    })
    .eq("user_id", userId);

  if (error) {
    console.error('Supabase error:', error); // ← log this
    throw new Error("Error updating entry mode.");
  }

  return mode;
}



