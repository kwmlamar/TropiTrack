"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  name: string
  email: string
  phone?: string
  role: string
  bio?: string
  location?: string
  website?: string
}) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: "User not authenticated" }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return { success: false, error: updateError.message }
    }

    // Update auth user metadata if email changed
    if (data.email !== user.email) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        email: data.email,
        data: {
          full_name: data.name,
        }
      })

      if (authUpdateError) {
        console.error("Error updating auth user:", authUpdateError)
        // Don't fail the entire operation for auth update errors
      }
    }

    revalidatePath("/dashboard/profile")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }
  }
} 