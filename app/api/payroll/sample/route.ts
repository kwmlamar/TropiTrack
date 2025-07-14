import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"

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

    // Get user profile with company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 400 }
      )
    }

    // Get or create a worker
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, name, position, hourly_rate")
      .eq("company_id", profile.company_id)
      .limit(1)

    if (workersError) {
      return NextResponse.json(
        { success: false, message: "Error fetching workers" },
        { status: 400 }
      )
    }

    let worker
    if (!workers || workers.length === 0) {
      // Create a sample worker
      const { data: newWorker, error: createWorkerError } = await supabase
        .from("workers")
        .insert([{
          name: "John Smith",
          position: "Construction Worker",
          hourly_rate: 25.00,
          company_id: profile.company_id,
          is_active: true
        }])
        .select()
        .single()

      if (createWorkerError) {
        return NextResponse.json(
          { success: false, message: "Error creating worker" },
          { status: 400 }
        )
      }
      worker = newWorker
    } else {
      worker = workers[0]
    }

    // Get or create a project
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .limit(1)

    if (projectsError) {
      return NextResponse.json(
        { success: false, message: "Error fetching projects" },
        { status: 400 }
      )
    }

    let project
    if (!projects || projects.length === 0) {
      // Create a sample project
      const { data: newProject, error: createProjectError } = await supabase
        .from("projects")
        .insert([{
          name: "Sample Construction Project",
          company_id: profile.company_id,
          status: "active"
        }])
        .select()
        .single()

      if (createProjectError) {
        return NextResponse.json(
          { success: false, message: "Error creating project" },
          { status: 400 }
        )
      }
      project = newProject
    } else {
      project = projects[0]
    }

    // Get current week dates (Saturday to Friday)
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 6 }) // Saturday
    const weekEnd = endOfWeek(today, { weekStartsOn: 6 }) // Friday

    // Create sample approved timesheets for the current week (Monday to Friday)
    const sampleTimesheets = []
    for (let i = 1; i <= 5; i++) { // Monday to Friday (skip Sunday)
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i) // Skip Sunday (day 0)
      
      const regularHours = 8 + Math.random() * 2 // 8-10 hours
      const overtimeHours = Math.random() * 2 // 0-2 hours
      const totalHours = regularHours + overtimeHours
      const hourlyRate = worker.hourly_rate || 25
      const totalPay = totalHours * hourlyRate

      sampleTimesheets.push({
        date: format(date, "yyyy-MM-dd"),
        worker_id: worker.id,
        project_id: project.id,
        task_description: "Construction work",
        clock_in: format(date, "yyyy-MM-dd") + "T08:00:00Z",
        clock_out: format(date, "yyyy-MM-dd") + "T17:00:00Z",
        break_duration: 60,
        regular_hours: Math.round(regularHours * 100) / 100,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        total_hours: Math.round(totalHours * 100) / 100,
        total_pay: Math.round(totalPay * 100) / 100,
        hourly_rate: hourlyRate,
        supervisor_approval: "approved", // All timesheets are approved
        company_id: profile.company_id,
        created_by: user.id,
      })
    }

    // Insert sample timesheets
    const { error: insertTimesheetError } = await supabase
      .from("timesheets")
      .insert(sampleTimesheets)

    if (insertTimesheetError) {
      return NextResponse.json(
        { success: false, message: "Error creating timesheets" },
        { status: 400 }
      )
    }

    // Generate payroll for the worker and week
    const weekStartStr = format(weekStart, "yyyy-MM-dd")
    const weekEndStr = format(weekEnd, "yyyy-MM-dd")
    
    const payrollResult = await generatePayrollForWorkerAndPeriod(
      user.id,
      worker.id,
      weekStartStr,
      weekEndStr
    )

    if (!payrollResult.success) {
      return NextResponse.json(
        { success: false, message: "Error generating payroll" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Sample payroll data created successfully",
      data: {
        timesheetsCreated: sampleTimesheets.length,
        payrollGenerated: payrollResult.data?.id
      }
    })
  } catch (error) {
    console.error("Error creating sample payroll data:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 