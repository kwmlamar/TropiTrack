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
    redirect("/error");
  }
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
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

  if (process.env.NODE_ENV === "development") {
    console.log("Auth Data:", authData);
    console.log("Auth Error:", authError);
  }

  if (authError || !authData.user) {
    console.error("Signup failed:", authError);
    redirect("/error"); // or better: throw error for debugging
  }

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
    redirect("/error");
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
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
    redirect("/error");
  }

  redirect("/verify-email");
}
