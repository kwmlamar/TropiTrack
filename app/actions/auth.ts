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
  const inviteToken = formData.get("invite_token") as string; // New field for invite tokens
  const testingCustomer = formData.get("testing_customer") as string; // Track free testing phase users

  // Validate inputs before signup
  if (!email || !password || !fullName) {
    return { error: "All fields are required", field: "general" };
  }

  // Parse first and last name from full name
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // If there's an invite token, validate it first
  let existingCompanyId: string | null = null;
  let inviteData: { company_id: string; role: string; email: string } | null = null;
  
  if (inviteToken) {
    try {
      // Get invite details
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', inviteToken)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        return { error: "Invalid or expired invitation", field: "general" };
      }

      // Check if email matches invite
      if (invite.email !== email) {
        return { error: "Email address doesn't match the invitation", field: "email" };
      }

      existingCompanyId = invite.company_id;
      inviteData = invite;
    } catch (error) {
      console.error("Error validating invite:", error);
      return { error: "Failed to validate invitation", field: "general" };
    }
  }

  // Create user with appropriate metadata
  const userMetadata: Record<string, string> = {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
  };

  if (existingCompanyId) {
    // For invited users, include company_id in metadata
    userMetadata.company_id = existingCompanyId;
    userMetadata.invite_token = inviteToken;
    userMetadata.role = inviteData?.role || 'worker';
  } else {
    // For new company signups, include company name
    userMetadata.company_name = companyName;
    userMetadata.selected_plan = plan;
    // Track testing phase customers
    if (testingCustomer === 'true') {
      userMetadata.testing_customer = 'true';
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      data: userMetadata,
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

  // For invited users, we need to manually create the profile since the trigger won't run
  if (existingCompanyId && inviteData) {
    try {
      // Create profile for invited user with all required fields
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: email,
          company_id: existingCompanyId,
          role: inviteData.role || 'worker',
          is_active: true,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating profile for invited user:', profileError);
        return { error: "Failed to create user profile", field: "general" };
      }

      // Mark invite as used
      const { error: inviteUpdateError } = await supabase
        .from('invites')
        .update({
          is_used: true,
          accepted_at: new Date().toISOString(),
          accepted_by: authData.user.id,
        })
        .eq('token', inviteToken);

      if (inviteUpdateError) {
        console.error('Error updating invite:', inviteUpdateError);
        // Don't fail the signup for this error
      }
    } catch (error) {
      console.error('Error handling invited user setup:', error);
      return { error: "Failed to complete signup process", field: "general" };
    }
  } else {
    // For new company signups, create trial subscription manually since the database trigger function has issues
    if (plan) {
      try {
        console.log('Creating trial subscription manually for new company signup');
        
        // Get the user's profile to get company_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError || !profile?.company_id) {
          console.error('Failed to get profile for subscription creation:', profileError);
          return { success: true, redirectTo: "/check-email" };
        }

        // Get the plan
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('slug', plan)
          .eq('is_active', true)
          .single();

        if (planError || !planData) {
          console.error('Failed to get plan for subscription creation:', planError);
          return { success: true, redirectTo: "/check-email" };
        }

        // Check if subscription already exists
        const { data: existingSubscription } = await supabase
          .from('company_subscriptions')
          .select('id')
          .eq('company_id', profile.company_id)
          .in('status', ['active', 'trialing'])
          .single();

        if (existingSubscription) {
          console.log('Subscription already exists for company');
          return { success: true, redirectTo: "/check-email" };
        }

        // Create Stripe trial subscription
        try {
          const trialResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/create-trial-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: authData.user.id,
              planId: plan,
              userEmail: email,
            }),
          });

          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            console.log('Successfully created Stripe trial subscription:', trialData);
          } else {
            const errorData = await trialResponse.json();
            console.error('Failed to create Stripe trial subscription:', errorData);
          }
        } catch (trialError) {
          console.error('Error calling trial subscription API:', trialError);
        }
      } catch (error) {
        console.error('Unexpected error creating subscription:', error);
      }
    }
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



// Google OAuth functions
export async function signInWithGoogle(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  
  console.log('Starting Google OAuth sign in...');
  console.log('Redirect URL:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
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
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
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

