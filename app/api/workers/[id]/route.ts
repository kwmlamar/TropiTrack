import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's company ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 400 }
      )
    }

    // Verify the worker belongs to the user's company
    const { data: worker } = await supabase
      .from("workers")
      .select("id, company_id")
      .eq("id", params.id)
      .eq("company_id", profile.company_id)
      .single()

    if (!worker) {
      return NextResponse.json(
        { success: false, error: "Worker not found or access denied" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Only allow updating nib_exempt field from this endpoint
    const { nib_exempt } = body
    
    if (typeof nib_exempt !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "Invalid data: nib_exempt must be a boolean" },
        { status: 400 }
      )
    }

    // Update the worker
    const { data: updatedWorker, error: updateError } = await supabase
      .from("workers")
      .update({
        nib_exempt,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("company_id", profile.company_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating worker:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update worker" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedWorker
    })
  } catch (error) {
    console.error("Error in worker update API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

