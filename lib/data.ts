import { supabase } from "./supabaseClient";

export async function addEmployee(employeeData: {
    full_name: string;
    role?: string;
    hourly_rate: number;
    status?: string;
}) {
    const { data, error } = await supabase
    .from('employees')
    .insert([employeeData]);

    if (error) throw error;
    return data;
}

// fetch employess from supabase
export async function fetchEmployees() {
    const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
} 