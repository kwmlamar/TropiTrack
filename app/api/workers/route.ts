import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's company ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 400 }
      )
    }

    // Get active workers for the company
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .eq("active", true)
      .order("name")

    if (workersError) {
      console.error("Error fetching workers:", workersError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch workers" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workers: workers || []
    })
  } catch (error) {
    console.error("Error in workers API:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 