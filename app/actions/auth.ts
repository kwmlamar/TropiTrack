"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/server-admin";

export async function login(formData: FormData) {
  const supabase = await createClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) {
  console.error("Login failed:", error.message); // 🔍 log it
  redirect("/error");
}

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const companyName = formData.get("company_name") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });

  if (!authData.user) {
    console.error("No user returned from signUp - likely due to email confirmation requried.")
    return redirect("/verify-email")
  }

  if (authError) {
    console.error("Signup failed:", authError);
    return redirect("/error");
  }

  // Insert company data
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .insert([
      {
        name: companyName,
        email,
      },
    ])
    .select()
    .single();

  if (companyError || !companyData) {
    console.error("Failed to create company.", companyError);
    return redirect("/error");
  }

  // Manually insert profile directly
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id: authData.user.id,
        name: fullName,
        email,
        company_id: companyData.id, // Assuming company_id is a UUID
      },
    ])
    .select()
    .single();

  if (profileError || !profileData) {
    console.error("Failed to create profile.", profileError);
    return redirect("/error");
  }

  // Update user metadata
  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authData.user.id,
    {
      user_metadata: {
        full_name: fullName,
        company_id: companyData.id,
      },
    }
  );

  if (updateError) {
    console.error("Failed to update user metadata", updateError);
    return redirect("/error");
  } else {
    console.log("Updated user metadata:", updatedUser?.user?.user_metadata);
  }

  return redirect("/verify-email");
}

