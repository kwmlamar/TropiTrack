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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login failed:", error.message);
    return { error: error.message, field: "email" }; // Optional: field-specific error
  }

  // Update last_login_at if login was successful
  if (data?.user) {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)

      if (updateError) {
        console.error('Error updating last_login_at:', updateError)
        // Don't fail the login for this error
      }
    } catch (err) {
      console.error('Unexpected error updating last_login_at:', err)
      // Don't fail the login for this error
    }
  }

  return { success: true };
}

export async function signup(formData: FormData): Promise<SignupResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const companyName = formData.get("company_name") as string || "My Company";
  const plan = formData.get("plan") as string;

  // Validate inputs before signup
  if (!email || !password || !fullName) {
    return { error: "All fields are required", field: "general" };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      data: {
        full_name: fullName,
        company_name: companyName,
        selected_plan: plan,
      },
    },
  });

  // Handle Supabase auth errors
  if (authError) {
    console.error("Signup failed:", authError);
    const message = authError.message || "Signup failed. Please try again.";
    const isEmailIssue = /email|registered|invalid|domain/i.test(message);
    return isEmailIssue ? { error: message, field: "email" } : { error: message };
  }

  // If email confirmation is required
  if (!authData.user) {
    console.warn("Email confirmation required");
    return { success: true, redirectTo: "/check-email" };
  }

  // Create trial subscription with better error handling
  try {
    const subscriptionResponse = await createTrialSubscription({
      userId: authData.user.id,
      planId: plan,
      userEmail: email,
    });

    if (!subscriptionResponse.success) {
      console.error('Subscription creation failed:', subscriptionResponse.error);
    }
  } catch (error) {
    console.error('Unexpected error creating subscription:', error);
  }

  // Verify profile creation (optional safety check)
  const { error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile creation might have failed:', profileError);
    // You could implement additional recovery logic here
  }

  return { success: true, redirectTo: "/check-email" };
}

// Separate function for subscription creation
async function createTrialSubscription({
  userId, 
  planId, 
  userEmail
}: {
  userId: string, 
  planId: string, 
  userEmail: string
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/create-trial-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId, userEmail }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Subscription creation failed: ${errorText}` 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
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

