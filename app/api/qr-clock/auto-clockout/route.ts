import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateAutomaticClockOuts } from "@/lib/data/qr-clock"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user profile to determine company
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { date, endOfDayTime = "17:00" } = body

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date parameter is required" },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      )
    }

    console.log(`[AUTO_CLOCKOUT_API] Starting automatic clock-out for company ${profile.company_id} on ${date}`)

    // Generate automatic clock-outs
    const result = await generateAutomaticClockOuts(
      profile.company_id,
      endOfDayTime
    )

    if (result.success) {
      console.log(`[AUTO_CLOCKOUT_API] Successfully processed ${result.data?.processed} workers`)
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.data?.processed} workers`,
        data: result.data
      })
    } else {
      console.error(`[AUTO_CLOCKOUT_API] Failed to generate automatic clock-outs:`, result.error)
      return NextResponse.json(
        { success: false, message: result.error || "Failed to generate automatic clock-outs" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("[AUTO_CLOCKOUT_API] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user profile to determine company
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 400 }
      )
    }

    // Get currently clocked-in workers for this company
    const { data: clockedInWorkers, error: workersError } = await supabase
      .rpc('get_clocked_in_workers', {
        company_uuid: profile.company_id
      })

    if (workersError) {
      console.error("[AUTO_CLOCKOUT_API] Error fetching clocked-in workers:", workersError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch clocked-in workers" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        clockedInWorkers: clockedInWorkers || [],
        count: clockedInWorkers?.length || 0
      }
    })

  } catch (error) {
    console.error("[AUTO_CLOCKOUT_API] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 