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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
      data: {
        full_name: fullName,
        company_name: companyName, // Pass company name to trigger
      },
    },
  });

  if (!authData.user) {
    console.error("No user returned from signUp - likely due to email confirmation required.")
    return { success: true, redirectTo: "/onboarding" };
  }

  if (authError) {
    console.error("Signup failed:", authError);
    return { error: "Signup failed. Please try again." };
  }

  // The database trigger (handle_new_user) will automatically create
  // the company and profile for new users
  // No need to manually create them here

  // Return success with redirect path
  return { success: true, redirectTo: "/onboarding" };
}

// Google OAuth functions
export async function signInWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  
  console.log('Starting Google OAuth sign in...');
  console.log('Redirect URL:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
  
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

  if (!data?.url) {
    console.error("No OAuth URL returned from Supabase");
    return { error: "Failed to generate OAuth URL" };
  }

  console.log('Google OAuth URL generated successfully');
  return { url: data.url };
}

export async function signUpWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  
  console.log('Starting Google OAuth sign up...');
  console.log('Redirect URL:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
  
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

  if (!data?.url) {
    console.error("No OAuth URL returned from Supabase");
    return { error: "Failed to generate OAuth URL" };
  }

  console.log('Google OAuth URL generated successfully');
  return { url: data.url };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // First verify the current password by attempting to sign in
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: currentPassword,
    });

    if (signInError || !user) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to update password. Please try again." };
  }
}

