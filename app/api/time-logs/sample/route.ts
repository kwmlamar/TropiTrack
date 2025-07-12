import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { createSampleTimeLogs } from "@/lib/data/time-logs"

export async function POST() {
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

    // Create sample time logs data
    const result = await createSampleTimeLogs(user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Sample time logs data created successfully"
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error creating sample time logs:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 