import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getTimeLogs } from "@/lib/data/time-logs"

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Parse dates if provided
    const fromDate = dateFrom ? new Date(dateFrom) : undefined
    const toDate = dateTo ? new Date(dateTo) : undefined

    // Get time logs data
    const result = await getTimeLogs(user.id, fromDate, toDate)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error in time logs API:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 