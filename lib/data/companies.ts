import { createClient } from "@/utils/supabase/server";

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  website?: string;
  tax_id?: string;
  business_number?: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateCompany = Partial<Omit<Company, "id" | "created_at" | "updated_at">>;

export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error) {
    console.error("Error fetching company:", error);
    return null;
  }

  return data;
}

export async function updateCompany(companyId: string, updates: UpdateCompany): Promise<Company | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("companies")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    console.error("Error updating company:", error);
    return null;
  }

  return data;
}

export async function getCurrentUserCompany(): Promise<Company | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error("Error getting current user:", userError);
    return null;
  }

  // Get user profile to find company_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error getting user profile:", profileError);
    return null;
  }

  // Get company details
  return getCompany(profile.company_id);
} 