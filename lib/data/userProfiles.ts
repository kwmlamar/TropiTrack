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
      console.error("No authenticated user found");
      throw new Error("User not authenticated");
    }

    if (!user.id) {
      console.error("User ID is undefined");
      throw new Error("User ID is undefined");
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
  try {
    const supabase = await createClient();
    const userId = await getAuthUserId();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Handle the case where no profile exists yet
      if (error.code === "PGRST116") {
        console.log("No profile found for user:", userId);
        return null; // Return null instead of throwing error
      }
      throw new Error(error.message);
    }
    
    return data; // This can be null if no profile exists
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    throw error;
  }
}

export async function getUserProfileWithCompany() {
  try {
    const supabase = await createClient();
    const userId = await getAuthUserId();

    console.log("getUserProfileWithCompany - userId:", userId);

    const { data, error } = await supabase
      .from("profiles")
      .select("*, companies(id, name)")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("getUserProfileWithCompany - query result:", { data, error });

    if (error) {
      // Handle the case where no profile exists yet
      if (error.code === "PGRST116") {
        console.log("No profile found for user:", userId);
        return null; // Return null instead of throwing error
      }
      throw new Error(error.message);
    }

    return {
      ...data,
      company: data?.companies, // normalize naming
    };
  } catch (error) {
    console.error("Error in getUserProfileWithCompany:", error);
    throw error;
  }
}

