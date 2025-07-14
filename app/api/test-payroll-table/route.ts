import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    console.log("[TestPayrollTable] Starting database test")
    const supabase = await createClient()
    
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[TestPayrollTable] User not found:", userError)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[TestPayrollTable] User authenticated:", user.id)

    // Test 1: Check if payroll table exists
    console.log("[TestPayrollTable] Testing payroll table existence...")
    const { error: tableError } = await supabase
      .from('payroll')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error("[TestPayrollTable] Payroll table error:", tableError)
      return NextResponse.json({
        success: false,
        message: `Payroll table error: ${tableError.message}`,
        error: tableError
      }, { status: 500 })
    }

    // Test 2: Get table structure
    console.log("[TestPayrollTable] Getting table structure...")
    const { error: structureError } = await supabase
      .from('payroll')
      .select('*')
      .limit(0)
    
    if (structureError) {
      console.error("[TestPayrollTable] Structure error:", structureError)
    }

    // Test 3: Count existing records
    console.log("[TestPayrollTable] Counting existing records...")
    const { count, error: countError } = await supabase
      .from('payroll')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error("[TestPayrollTable] Count error:", countError)
    }

    // Test 4: Check user profile and company
    console.log("[TestPayrollTable] Checking user profile...")
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error("[TestPayrollTable] Profile error:", profileError)
    }

    // Test 5: Check workers table
    console.log("[TestPayrollTable] Checking workers table...")
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, company_id')
      .limit(5)
    
    if (workersError) {
      console.error("[TestPayrollTable] Workers error:", workersError)
    }

    // Test 6: Check timesheets table
    console.log("[TestPayrollTable] Checking timesheets table...")
    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('id, worker_id, supervisor_approval, date')
      .eq('supervisor_approval', 'approved')
      .limit(5)
    
    if (timesheetsError) {
      console.error("[TestPayrollTable] Timesheets error:", timesheetsError)
    }

    console.log("[TestPayrollTable] All tests completed successfully")
    
    return NextResponse.json({
      success: true,
      message: "Database connection and table tests completed",
      data: {
        payrollTableExists: !tableError,
        payrollRecordCount: count || 0,
        userProfile: profile ? { id: profile.id, company_id: profile.company_id } : null,
        workersCount: workers?.length || 0,
        approvedTimesheetsCount: timesheets?.length || 0,
        tableError: tableError ? String(tableError) : null,
        profileError: profileError ? String(profileError) : null,
        workersError: workersError ? String(workersError) : null,
        timesheetsError: timesheetsError ? String(timesheetsError) : null
      }
    })
  } catch (error) {
    console.error("[TestPayrollTable] Error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 