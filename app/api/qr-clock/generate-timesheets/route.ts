import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { generateTimesheetFromClockEvents, generateTimesheetsForDate } from "@/lib/data/qr-clock"
import { getProfile } from "@/lib/data/data"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const profile = await getProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { date, project_id, worker_id, rounding_strategy, round_to_standard } = body

    if (!date || !project_id) {
      return NextResponse.json(
        { success: false, message: "Date and project_id are required" },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validate rounding strategy
    const validRoundingStrategies = ["standard", "exact", "quarter_hour", "no_rounding"]
    if (rounding_strategy && !validRoundingStrategies.includes(rounding_strategy)) {
      return NextResponse.json(
        { success: false, message: "Invalid rounding strategy" },
        { status: 400 }
      )
    }

    // Verify project belongs to user's company
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", project_id)
      .eq("company_id", profile.company_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, message: "Project not found or unauthorized" },
        { status: 400 }
      )
    }

    let result

    if (worker_id) {
      // Generate timesheet for specific worker
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .select("id, name")
        .eq("id", worker_id)
        .eq("company_id", profile.company_id)
        .single()

      if (workerError || !worker) {
        return NextResponse.json(
          { success: false, message: "Worker not found or unauthorized" },
          { status: 400 }
        )
      }

      result = await generateTimesheetFromClockEvents(
        profile.company_id,
        worker_id,
        project_id,
        date,
        rounding_strategy || "standard",
        round_to_standard ?? true
      )
    } else {
      // Generate timesheets for all workers
      result = await generateTimesheetsForDate(
        profile.company_id,
        project_id,
        date,
        rounding_strategy || "standard",
        round_to_standard ?? true
      )
    }

    if (result.success) {
      const message = worker_id 
        ? "Timesheet generated successfully" 
        : `Generated ${(result.data as { created: number; errors: string[] })?.created} timesheets successfully`
      
      return NextResponse.json({
        success: true,
        message,
        data: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to generate timesheets"
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Error generating timesheets:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 