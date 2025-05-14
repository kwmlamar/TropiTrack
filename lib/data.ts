"use server";

import { supabase } from "./supabaseClient";
import { Employee, Client } from "@/lib/types";

// EMPLOYEES

// Get all employees
export async function fetchEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch employees: " + error.message);
  return data ?? [];
}

// Add new employee
export async function addEmployee(employeeData: {
  name: string;
  role?: string;
  hourly_rate: number;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select() // this ensures data is returned
    .single();

  if (error) throw new Error("Failed to add employee: " + error.message);
  return data?.[0]; // return the inserted employee
}

// Delete an employee
export async function deleteEmployee(employeeId: number) {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", employeeId);

  if (error) throw new Error("Failed to delete employee: " + error.message);
  return; // don't return `true` — just return nothing (void) on success
}

export async function updateEmployee(employee: Employee) {
  const { data, error } = await supabase
    .from("employees")
    .update({
      name: employee.name,
      hourly_rate: employee.hourly_rate,
      active: employee.active,
    })
    .eq("id", employee.id)
    .select()
    .single();

  if (error) throw new Error("Failed to delete employee:" + error.message);
  if (!data) throw new Error("No data returned from updateEmployee");
  return data;
}

// CLIENTS

// fetch Clients
export async function fetchClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch clients:" + error.message);

  return data ?? [];
}

export async function createClient(clientData: {
  name: string;
  email?: string;
}) {
  const { data, error } = await supabase
    .from("clients")
    .insert([clientData])
    .select()
    .single();

  if (error) throw new Error("Failed to create new client:" + error.message);
  return data?.[0];
}

export async function deleteClient(clientId: number) {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) throw new Error("Failed to delete client" + error.message);
  return;
}

export async function updateClient(client: Client) {
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: client.name,
      email: client.email,
    })
    .eq("id", client.id)
    .select()
    .single();

  if (error) throw new Error("Failed to update client:" + error.message);
  if (!data) throw new Error("No data returned from updateClient");
  return data;
}


