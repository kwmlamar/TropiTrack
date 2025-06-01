"use server"

import { supabaseAdmin } from "@/utils/supabase/server-admin"
import { acceptInvite } from "@/lib/data/invites"
import { createUser } from "@/lib/data/users"
import type { NewUser } from "@/lib/types/user"

interface OnboardingData {
  token: string
  firstName: string
  lastName: string
  password: string
  email: string
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    // 1. Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return {
        success: false,
        error: "Failed to create user account",
      }
    }

    // 2. Accept the invite to get company information
    const inviteResponse = await acceptInvite(data.token, authData.user.id)

    if (!inviteResponse.success || !inviteResponse.data) {
      // Clean up the created user if invite acceptance fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: "Failed to accept invitation",
      }
    }

    // 3. Create user profile in our users table
    const userData: NewUser = {
      id: authData.user.id,
      company_id: inviteResponse.data.company_id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: inviteResponse.data.role,
      is_active: true,
    }

    const userResponse = await createUser(userData)

    if (!userResponse.success) {
      // Clean up if user profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: "Failed to create user profile",
      }
    }

    return {
      success: true,
      data: {
        user: userResponse.data,
        invite: inviteResponse.data,
      },
    }
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
