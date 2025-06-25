"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAuthUserId() {
  const supabase = await createClient();
  const { data: {user}, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not found")
  }

  return user.id
}

export async function getUserProfile() {
  const supabase = await createClient();
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserProfileWithCompany() {
  const supabase = await createClient();
  const userId = await getAuthUserId();

  // First, get the basic profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);

  // If profile doesn't have company_id, return it without company info
  if (!profile.company_id) {
    return {
      ...profile,
      company: null,
    };
  }

  // If profile has company_id, get the company info
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", profile.company_id)
    .single();

  if (companyError) {
    console.error("Error fetching company:", companyError);
    return {
      ...profile,
      company: null,
    };
  }

  return {
    ...profile,
    company: companyData,
  };
}

