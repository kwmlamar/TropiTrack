import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { Worker, Client } from "@/lib/types";
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
export async function deleteEmployee(workerId: number, {user}: {user: User}) {
  const profile = await getProfile(user.id);
  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", workerId)
    .eq("company_id", profile.company_id);

  if (error) throw new Error("Failed to delete worker: " + error.message);
  return; // don't return `true` — just return nothing (void) on success
}

export async function updateEmployee(worker: Worker, {user}: {user: User} ){
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
  return data?.[0];
}

export async function deleteClient(clientId: number, { user }: { user: User }) {
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


