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


  const { data, error } = await supabase
    .from("profiles")
    .select("*, companies(id, name)")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    company: data.companies, // normalize naming
  };
}

