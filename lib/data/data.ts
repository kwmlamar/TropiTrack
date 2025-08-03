import { supabase } from "@/lib/supabaseClient";
import { Worker, Client, Project, EntryMode, Timesheet } from "@/lib/types";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { User } from "@supabase/supabase-js";

// PROFILE INFO
export async function getProfile(userId: string) {
  console.log("getProfile called with userId:", userId);
  
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Profile query result:", { profile, profileError });

    if (profileError) {
      console.error("Profile error details:", profileError);
      throw new Error(
        `error fetching profile info: ${JSON.stringify(profileError)}`
      );
    }

    if (!profile) {
      throw new Error("Profile not found for user: " + userId);
    }

    return profile;
  } catch (error) {
    console.error("Error in getProfile:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error fetching profile: ${error}`);
  }
}

// WORKERS

// Get all workers

export async function fetchWorkersForCompany(userId: string) {
  console.log("fetchWorkersForCompany called with userId:", userId);
  
  const profile = await getProfile(userId);
  console.log("Profile data:", profile);
  console.log("Profile company_id:", profile.company_id);

  // Test the query without RLS to see if there are workers
  const { data: allWorkers, error: allWorkersError } = await supabase
    .from("workers")
    .select("*");
  
  console.log("All workers (no RLS):", { allWorkers, allWorkersError });

  // Test the RLS function directly
  const { data: rlsTest, error: rlsError } = await supabase
    .rpc('get_user_company_id');

  console.log("RLS function test:", { rlsTest, rlsError });

  // Test RLS-only query (should work if RLS is working)
  const { data: rlsQuery, error: rlsQueryError } = await supabase
    .from("workers")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("RLS-only query result:", { rlsQuery, rlsQueryError });

  // Test manual filtering (current approach)
  const { data: manualQuery, error: manualError } = await supabase
    .from("workers")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  console.log("Manual filtering result:", { manualQuery, manualError });

  // Use the manual approach for now since RLS isn't working
  if (manualError) throw new Error("Failed to fetch worker: " + manualError.message);
  return manualQuery ?? [];
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
export async function fetchClientsForCompany(userId: string) {
  const profile = await getProfile(userId);
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

export async function fetchProjectsForCompany(userId: string) {
  const profile = await getProfile(userId);

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
    );
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
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error)
    throw new Error("Failed to fetch user_preferences:" + error.message);

  return data;
}

import { VisibilityState } from "@tanstack/react-table";

export async function savePreferences(
  userId: string,
  columnVisibility: VisibilityState
) {
  const { data, error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      column_visibility: columnVisibility,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to save preferences:", error);
  }

  return data;
}

export async function updateEntryMode(
  userId: string,
  mode: EntryMode
): Promise<EntryMode> {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      entry_mode: mode,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Supabase error:", error); // ← log this
    throw new Error("Error updating entry mode.");
  }

  return mode;
}

// TIMESHEETS

export async function fetchTimesheets({
  user,
  date,
  viewMode,
}: {
  user: User;
  date: Date;
  viewMode: "daily" | "weekly";
}): Promise<Timesheet[]> {
  const profile = await getProfile(user.id);
  if (!profile) throw new Error("No profile found for user.");

  let startDate = date;
  let endDate = date;

  if (viewMode === "weekly") {
    startDate = startOfWeek(date, { weekStartsOn: 6 }); // Default to Saturday for construction industry
    endDate = endOfWeek(date, { weekStartsOn: 6 });
  }

  const formattedStart = format(startDate, "yyyy-MM-dd");
  const formattedEnd = format(endDate, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("timesheets")
    .select("*") // or a specific list of fields
    .eq("company_id", profile.company_id)
    .gte("date", formattedStart)
    .lte("date", formattedEnd);

  if (error) throw new Error("Error fetching timesheets: " + error.message);

  return data as Timesheet[];
}

interface WeeklyTimesheetProps {
  user: User;
  selectedWorker: Worker;
  selectedProject: Project;
  startDate: string;
  regularHours: number;
  overtimeHours: number;
  supervisorApproval: boolean;
  notes: string;
}

export async function generateWeeklyTimesheet(input: WeeklyTimesheetProps) {
  const {
    user,
    selectedWorker,
    selectedProject,
    startDate,
    regularHours,
    overtimeHours,
    supervisorApproval,
    notes,
  } = input;

  const profile = await getProfile(user.id);

  const weekStart = startOfWeek(new Date(startDate), { weekStartsOn: 6 }); // Saturday for construction industry

  const timesheets = Array.from({ length: 7 })
    .map((_, i) => {
      const date = addDays(weekStart, i); // Sat–Fri
      return {
        company_id: profile.company_id,
        worker_id: selectedWorker.id,
        project_id: selectedProject.id,
        date: date.toISOString().split("T")[0],
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        hourly_rate: selectedWorker.hourly_rate,
        supervisor_approval: supervisorApproval,
        notes,
      };
    })
    .filter((entry) => {
      const day = new Date(entry.date).getDay(); // 0 = Sunday
      return day !== 0; // exclude Sunday
    });

  const { error } = await supabase.from("timesheets").insert(timesheets);

  if (error) throw error;
}



interface TimesheetProps {
  user: User;
  selectedWorker: Worker;
  selectedProject: Project;
  date: string;
  regularHours: number;
  overtimeHours: number;
  supervisorApproval: boolean;
  notes: string;
}

export async function generateTimesheet({
  user,
  selectedWorker,
  selectedProject,
  date,
  regularHours,
  overtimeHours,
  supervisorApproval,
  notes,
}: TimesheetProps) {
  const profile = await getProfile(user.id);

  const { error } = await supabase.from("timesheets").insert({
    worker_id: selectedWorker.id,
    project_id: selectedProject.id,
    date,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    supervisor_approval: supervisorApproval,
    notes,
    hourly_rate: selectedWorker.hourly_rate,
    company_id: profile.company_id,
  });

  if (error) {
    console.error("Error saving timesheet:", error.message);
    throw new Error("Failed to save timesheet");
  }
}

export async function deleteWeeklyTimesheets({
  userId,
  workerId,
  startDate,
} : { 
  userId: string;
  workerId: string;
  startDate: string | Date;
}) {
  const profile = await getProfile(userId);

  const weekStart = startOfWeek(new Date(startDate), { weekStartsOn: 6 }); // Saturday for construction industry
  const weekEnd = endOfWeek(new Date(startDate), { weekStartsOn: 6 });

  const { error } = await supabase
  .from("timesheets")
  .delete()
  .match({ company_id: profile.company_id, worker_id: workerId })
  .gte("date", weekStart.toISOString())
  .lte("date", weekEnd.toISOString());

  if (error) {
    console.error("Error deleting weekly timesheets:", error.message);
    throw new Error("Failed to delete weekly timesheets");
  }
}

export async function deleteTimesheet({
  userId,
  timesheetId,
}: {
  userId: string;
  timesheetId: string | number;
}) {
  const profile = await getProfile(userId);

  const { error } = await supabase
    .from("timesheets")
    .delete()
    .eq("id", timesheetId)
    .eq("company_id", profile.company_id);

  if (error) {
    console.error("Error deleting timesheet:", error.message);
    throw new Error("Failed to delete timesheet");
  }
}

export async function updateTimesheet(
  id: string,
  {
    user,
    selectedWorker,
    selectedProject,
    date,
    regularHours,
    overtimeHours,
    supervisorApproval,
    notes,
  }: TimesheetProps
) {
  if (!id) {
    throw new Error("Timesheet ID is required to update.");
  }

  const profile = await getProfile(user.id);

  const { error } = await supabase
    .from("timesheets")
    .update({
      worker_id: selectedWorker.id,
      project_id: selectedProject.id,
      date,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      supervisor_approval: supervisorApproval,
      notes,
      hourly_rate: selectedWorker.hourly_rate,
      company_id: profile.company_id,
    })
    .eq("id", id);

  if (error) {
    throw new Error("Error updating timesheet:" + error.message);
  }
}
