"use server";

import { createClient } from "@/utils/supabase/server";

type LoginResult =
  | { success: true }
  | { error: string; field?: string } // <-- allow field optionally with error

type SignupResult =
  | { success: true; redirectTo?: string }
  | { error: string; field?: string }

export async function login(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login failed:", error.message);
    return { error: error.message, field: "email" }; // Optional: field-specific error
  }

  return { success: true };
}

export async function signup(formData: FormData): Promise<SignupResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const companyName = formData.get("company_name") as string || "My Company";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      data: {
        full_name: fullName,
        company_name: companyName, // Pass company name to trigger
      },
    },
  });

  if (!authData.user) {
    console.error("No user returned from signUp - likely due to email confirmation required.")
    return { success: true, redirectTo: "/verify-email" };
  }

  if (authError) {
    console.error("Signup failed:", authError);
    return { error: "Signup failed. Please try again." };
  }

  // The database trigger (handle_new_user) will automatically create
  // the company and profile for new users
  // No need to manually create them here

  // Return success with redirect path
  return { success: true, redirectTo: "/verify-email" };
}

// Google OAuth functions
export async function signInWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error);
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signUpWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error);
    return { error: error.message };
  }

  return { url: data.url };
}

