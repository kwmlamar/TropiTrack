"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAuthUserId() {
  try {
    const supabase = await createClient();
    const { data: {user}, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      throw new Error(`Authentication error: ${error.message}`);
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    return user.id;
  } catch (error) {
    console.error("Error in getAuthUserId:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error getting user ID: ${error}`);
  }
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

