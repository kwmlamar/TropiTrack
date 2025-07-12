import { supabase } from "@/lib/supabaseClient"
import { getProfile } from "./data"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import type { ApiResponse } from "@/lib/types"

export interface TimeLogStats {
  regularHours: number
  overtimeHours: number
  totalHours: number
  totalPaid: number
  regularHoursChange: number
  overtimeHoursChange: number
  totalHoursChange: number
  totalPaidChange: number
}

export interface WorkerTimeLog {
  id: string
  name: string
  position: string
  project: string
  approved: {
    regularHours: number
    overtimeHours: number
    totalHours: number
  }
  unapproved: {
    regularHours: number
    overtimeHours: number
    totalHours: number
  }
}

export interface TimeLogsData {
  stats: TimeLogStats
  workers: WorkerTimeLog[]
}

interface TimesheetData {
  id: string
  worker_id: string
  regular_hours: number
  overtime_hours: number
  total_pay: number
  supervisor_approval: string
  worker?: {
    id: string
    name: string
    position: string
  }
  project?: {
    id: string
    name: string
  }
}

interface ClockEventData {
  id: string
  worker_id: string
  event_time: string
  event_type: string
  worker?: {
    id: string
    name: string
  }
  project?: {
    id: string
    name: string
  }
}

/**
 * Get time logs data for a specific date range
 */
export async function getTimeLogs(
  userId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ApiResponse<TimeLogsData>> {
  try {
    const profile = await getProfile(userId)
    if (!profile) {
      return {
        data: null,
        error: "User profile not found",
        success: false,
      }
    }

    // Set default date range if not provided
    const fromDate = dateFrom || new Date()
    const toDate = dateTo || new Date()
    
    const formattedFrom = format(fromDate, "yyyy-MM-dd")
    const formattedTo = format(toDate, "yyyy-MM-dd")

    // Calculate previous period for comparison
    const periodDuration = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousFromDate = subDays(fromDate, periodDuration)
    const previousToDate = subDays(fromDate, 1)
    
    const previousFormattedFrom = format(previousFromDate, "yyyy-MM-dd")
    const previousFormattedTo = format(previousToDate, "yyyy-MM-dd")

    // Get timesheets for current period
    const { data: currentTimesheets, error: currentError } = await supabase
      .from("timesheets")
      .select(`
        *,
        worker:workers(id, name, position, hourly_rate),
        project:projects(id, name)
      `)
      .eq("company_id", profile.company_id)
      .gte("date", formattedFrom)
      .lte("date", formattedTo)
      .order("date", { ascending: false })

    if (currentError) {
      console.error("Error fetching current timesheets:", currentError)
      return {
        data: null,
        error: currentError.message,
        success: false,
      }
    }

    // Get timesheets for previous period
    const { data: previousTimesheets, error: previousError } = await supabase
      .from("timesheets")
      .select(`
        *,
        worker:workers(id, name, position, hourly_rate),
        project:projects(id, name)
      `)
      .eq("company_id", profile.company_id)
      .gte("date", previousFormattedFrom)
      .lte("date", previousFormattedTo)
      .order("date", { ascending: false })

    if (previousError) {
      console.error("Error fetching previous timesheets:", previousError)
      // Continue with current data only if previous data fails
    }

    // Calculate stats with percentage changes
    const currentStats = calculateTimeLogStats(currentTimesheets || [])
    const previousStats = calculateTimeLogStats(previousTimesheets || [])
    const statsWithChanges = calculatePercentageChanges(currentStats, previousStats)
    
    // Calculate worker time logs
    const workers = calculateWorkerTimeLogs(currentTimesheets || [])

    return {
      data: {
        stats: statsWithChanges,
        workers,
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Error fetching time logs:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Calculate time log statistics from timesheets
 */
function calculateTimeLogStats(timesheets: TimesheetData[]): Omit<TimeLogStats, 'regularHoursChange' | 'overtimeHoursChange' | 'totalHoursChange' | 'totalPaidChange'> {
  let totalRegularHours = 0
  let totalOvertimeHours = 0
  let totalPaid = 0

  timesheets.forEach((timesheet) => {
    totalRegularHours += timesheet.regular_hours || 0
    totalOvertimeHours += timesheet.overtime_hours || 0
    totalPaid += timesheet.total_pay || 0
  })

  return {
    regularHours: Math.round(totalRegularHours * 100) / 100,
    overtimeHours: Math.round(totalOvertimeHours * 100) / 100,
    totalHours: Math.round((totalRegularHours + totalOvertimeHours) * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
  }
}

/**
 * Calculate percentage changes between current and previous periods
 */
function calculatePercentageChanges(
  current: Omit<TimeLogStats, 'regularHoursChange' | 'overtimeHoursChange' | 'totalHoursChange' | 'totalPaidChange'>,
  previous: Omit<TimeLogStats, 'regularHoursChange' | 'overtimeHoursChange' | 'totalHoursChange' | 'totalPaidChange'>
): TimeLogStats {
  const calculateChange = (currentValue: number, previousValue: number): number => {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0
    }
    return Math.round(((currentValue - previousValue) / previousValue) * 100)
  }

  return {
    ...current,
    regularHoursChange: calculateChange(current.regularHours, previous.regularHours),
    overtimeHoursChange: calculateChange(current.overtimeHours, previous.overtimeHours),
    totalHoursChange: calculateChange(current.totalHours, previous.totalHours),
    totalPaidChange: calculateChange(current.totalPaid, previous.totalPaid),
  }
}

/**
 * Calculate worker time logs grouped by worker
 */
function calculateWorkerTimeLogs(timesheets: TimesheetData[]): WorkerTimeLog[] {
  const workerMap = new Map<string, WorkerTimeLog>()

  timesheets.forEach((timesheet) => {
    const workerId = timesheet.worker_id
    const workerName = timesheet.worker?.name || "Unknown Worker"
    const workerPosition = timesheet.worker?.position || "Construction Worker"
    const projectName = timesheet.project?.name || "Unknown Project"
    
    const regularHours = timesheet.regular_hours || 0
    const overtimeHours = timesheet.overtime_hours || 0
    const totalHours = regularHours + overtimeHours

    if (!workerMap.has(workerId)) {
      workerMap.set(workerId, {
        id: workerId,
        name: workerName,
        position: workerPosition,
        project: projectName,
        approved: {
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
        },
        unapproved: {
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
        },
      })
    }

    const worker = workerMap.get(workerId)!
    
    if (timesheet.supervisor_approval === "approved") {
      worker.approved.regularHours += regularHours
      worker.approved.overtimeHours += overtimeHours
      worker.approved.totalHours += totalHours
    } else {
      worker.unapproved.regularHours += regularHours
      worker.unapproved.overtimeHours += overtimeHours
      worker.unapproved.totalHours += totalHours
    }
  })

  // Round all values to 2 decimal places
  return Array.from(workerMap.values()).map((worker) => ({
    ...worker,
    approved: {
      regularHours: Math.round(worker.approved.regularHours * 100) / 100,
      overtimeHours: Math.round(worker.approved.overtimeHours * 100) / 100,
      totalHours: Math.round(worker.approved.totalHours * 100) / 100,
    },
    unapproved: {
      regularHours: Math.round(worker.unapproved.regularHours * 100) / 100,
      overtimeHours: Math.round(worker.unapproved.overtimeHours * 100) / 100,
      totalHours: Math.round(worker.unapproved.totalHours * 100) / 100,
    },
  }))
}

/**
 * Get clock events for a specific worker and date range
 */
export async function getWorkerClockEvents(
  userId: string,
  workerId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ApiResponse<ClockEventData[]>> {
  try {
    const profile = await getProfile(userId)
    if (!profile) {
      return {
        data: null,
        error: "User profile not found",
        success: false,
      }
    }

    let query = supabase
      .from("clock_events")
      .select(`
        *,
        worker:workers(id, name),
        project:projects(id, name)
      `)
      .eq("worker_id", workerId)
      .eq("company_id", profile.company_id)
      .order("event_time", { ascending: false })

    if (dateFrom) {
      const startOfDayDate = startOfDay(dateFrom)
      query = query.gte("event_time", startOfDayDate.toISOString())
    }

    if (dateTo) {
      const endOfDayDate = endOfDay(dateTo)
      query = query.lte("event_time", endOfDayDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching clock events:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data || [],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Error fetching clock events:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create sample time logs data for testing
 */
export async function createSampleTimeLogs(userId: string): Promise<ApiResponse<boolean>> {
  try {
    const profile = await getProfile(userId)
    if (!profile) {
      return {
        data: null,
        error: "User profile not found",
        success: false,
      }
    }

    // First, get or create a worker
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, name, position, hourly_rate")
      .eq("company_id", profile.company_id)
      .limit(1)

    if (workersError) {
      console.error("Error fetching workers:", workersError)
      return {
        data: null,
        error: workersError.message,
        success: false,
      }
    }

    if (!workers || workers.length === 0) {
      return {
        data: null,
        error: "No workers found. Please create workers first.",
        success: false,
      }
    }

    const worker = workers[0]

    // Get or create a project
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .limit(1)

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      return {
        data: null,
        error: projectsError.message,
        success: false,
      }
    }

    if (!projects || projects.length === 0) {
      return {
        data: null,
        error: "No projects found. Please create projects first.",
        success: false,
      }
    }

    const project = projects[0]

    // Create sample timesheets for the last 14 days (7 for current period, 7 for previous period)
    const sampleTimesheets = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const regularHours = 8 + Math.random() * 2 // 8-10 hours
      const overtimeHours = Math.random() * 2 // 0-2 hours
      const totalHours = regularHours + overtimeHours
      const hourlyRate = worker.hourly_rate || 15
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
        supervisor_approval: i % 3 === 0 ? "pending" : "approved", // Mix of approved and pending
        company_id: profile.company_id,
        created_by: userId,
      })
    }

    // Insert sample timesheets
    const { error: insertError } = await supabase
      .from("timesheets")
      .insert(sampleTimesheets)

    if (insertError) {
      console.error("Error inserting sample timesheets:", insertError)
      return {
        data: null,
        error: insertError.message,
        success: false,
      }
    }

    return {
      data: true,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Error creating sample time logs:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
} 