import { supabase } from "@/lib/supabaseClient";

export async function getProfileClient(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
} 