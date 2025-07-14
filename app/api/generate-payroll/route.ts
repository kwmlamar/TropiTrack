import { NextRequest, NextResponse } from "next/server"
import { generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[GeneratePayrollAPI] Starting payroll generation request")
    const supabase = await createClient()
    
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[GeneratePayrollAPI] User not found:", userError)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[GeneratePayrollAPI] User authenticated:", user.id)
    const { workerId, weekStart, weekEnd, userId } = await request.json()
    console.log("[GeneratePayrollAPI] Request parameters:", { workerId, weekStart, weekEnd, userId })

    if (!workerId || !weekStart || !weekEnd) {
      console.error("[GeneratePayrollAPI] Missing required parameters")
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Test database connection and table existence
    console.log("[GeneratePayrollAPI] Testing database connection...")
    const { error: tableError } = await supabase
      .from('payroll')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error("[GeneratePayrollAPI] Database table error:", tableError)
      return NextResponse.json(
        { success: false, message: `Database error: ${tableError.message}` },
        { status: 500 }
      )
    }
    console.log("[GeneratePayrollAPI] Database connection successful")

    console.log("[GeneratePayrollAPI] Calling generatePayrollForWorkerAndPeriod")
    const result = await generatePayrollForWorkerAndPeriod(
      userId || user.id,
      workerId,
      weekStart,
      weekEnd
    )

    console.log("[GeneratePayrollAPI] Payroll generation result:", result)

    if (!result.success) {
      console.error("[GeneratePayrollAPI] Payroll generation failed:", result.error)
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }

    console.log("[GeneratePayrollAPI] Payroll generation successful")
    return NextResponse.json({
      success: true,
      message: "Payroll generated successfully",
      data: result.data
    })
  } catch (error) {
    console.error("[GeneratePayrollAPI] Error generating payroll:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 