import { supabase } from "./supabaseClient";

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
  status?: string;
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
