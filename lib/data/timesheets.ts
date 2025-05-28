import { createClient } from "@supabase/supabase-js"
import type {
  Timesheet,
  CreateTimesheetInput,
  UpdateTimesheetInput,
  ApiResponse,
  TimesheetFilters,
  TimesheetWithDetails,
} from "@/lib/types"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

/**
 * Get timesheets with optional filtering and related data
 */
export async function getTimesheets(filters: TimesheetFilters = {}): Promise<ApiResponse<TimesheetWithDetails[]>> {
  try {
    let query = supabase
      .from("timesheets")
      .select(`
        *,
        worker:workers(id, name, role),
        project:projects(id, name, location)
      `)
      .order("date", { ascending: false })

    // Apply filters
    if (filters.worker_id) {
      query = query.eq("worker_id", filters.worker_id)
    }

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id)
    }

    if (filters.date_from) {
      query = query.gte("date", filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte("date", filters.date_to)
    }

    if (filters.supervisor_approval !== undefined) {
      query = query.eq("supervisor_approval", filters.supervisor_approval)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching timesheets:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as TimesheetWithDetails[],
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching timesheets:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get a single timesheet by ID
 */
export async function getTimesheet(id: string): Promise<ApiResponse<TimesheetWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        worker:workers(id, name, role),
        project:projects(id, name, location)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching timesheet:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as TimesheetWithDetails,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching timesheet:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new timesheet
 */
export async function createTimesheet(timesheet: CreateTimesheetInput): Promise<ApiResponse<Timesheet>> {
  try {
    // Calculate totals before inserting
    const calculatedTimesheet = calculateTimesheetTotals(timesheet)

    const { data, error } = await supabase.from("timesheets").insert([calculatedTimesheet]).select().single()

    if (error) {
      console.error("Error creating timesheet:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Timesheet,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error creating timesheet:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update an existing timesheet
 */
export async function updateTimesheet(timesheet: UpdateTimesheetInput): Promise<ApiResponse<Timesheet>> {
  try {
    const { id, ...updateData } = timesheet

    // Recalculate totals if time-related fields are being updated
    const fieldsToRecalculate = ["clock_in", "clock_out", "break_duration", "hourly_rate"]
    const shouldRecalculate = fieldsToRecalculate.some((field) => field in updateData)

    let finalUpdateData = updateData
    if (shouldRecalculate) {
      // Get current timesheet data to merge with updates
      const currentResult = await getTimesheet(id)
      if (!currentResult.success || !currentResult.data) {
        return {
          data: null,
          error: "Could not fetch current timesheet for calculation",
          success: false,
        }
      }

      const mergedData = { ...currentResult.data, ...updateData }
      finalUpdateData = calculateTimesheetTotals(mergedData)
    }

    const { data, error } = await supabase.from("timesheets").update(finalUpdateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating timesheet:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data as Timesheet,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error updating timesheet:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a timesheet
 */
export async function deleteTimesheet(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("timesheets").delete().eq("id", id)

    if (error) {
      console.error("Error deleting timesheet:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: true,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error deleting timesheet:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Bulk update multiple timesheets (useful for supervisor approval)
 */
export async function bulkUpdateTimesheets(
  updates: { id: string; supervisor_approval?: boolean; notes?: string }[],
): Promise<ApiResponse<Timesheet[]>> {
  try {
    const results = await Promise.all(updates.map((update) => updateTimesheet(update)))

    const errors = results.filter((result) => !result.success)
    if (errors.length > 0) {
      return {
        data: null,
        error: `Failed to update ${errors.length} timesheets`,
        success: false,
      }
    }

    const data = results.map((result) => result.data).filter(Boolean) as Timesheet[]

    return {
      data,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error in bulk update:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Helper function to calculate timesheet totals
 */
function calculateTimesheetTotals(timesheet: Partial<Timesheet>): Partial<Timesheet> {
  if (!timesheet.clock_in || !timesheet.clock_out || !timesheet.hourly_rate) {
    return timesheet
  }

  try {
    const clockIn = new Date(`${timesheet.date}T${timesheet.clock_in}`)
    const clockOut = new Date(`${timesheet.date}T${timesheet.clock_out}`)

    // Calculate total hours worked (in hours)
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60)
    const breakMinutes = timesheet.break_duration || 0
    const workedMinutes = totalMinutes - breakMinutes
    const totalHours = Math.max(0, workedMinutes / 60)

    // Calculate regular and overtime hours (assuming 8 hours is regular)
    const regularHours = Math.min(totalHours, 8)
    const overtimeHours = Math.max(0, totalHours - 8)

    // Calculate total pay (overtime is typically 1.5x)
    const regularPay = regularHours * timesheet.hourly_rate
    const overtimePay = overtimeHours * timesheet.hourly_rate * 1.5
    const totalPay = regularPay + overtimePay

    return {
      ...timesheet,
      total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      regular_hours: Math.round(regularHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      total_pay: Math.round(totalPay * 100) / 100,
    }
  } catch (error) {
    console.error("Error calculating timesheet totals:", error)
    return timesheet
  }
}

/**
 * Get timesheet summary for a date range
 */
export async function getTimesheetSummary(filters: TimesheetFilters): Promise<
  ApiResponse<{
    totalHours: number
    totalRegularHours: number
    totalOvertimeHours: number
    totalPay: number
    timesheetCount: number
  }>
> {
  try {
    const result = await getTimesheets(filters)

    if (!result.success || !result.data) {
      return {
        data: null,
        error: result.error,
        success: false,
      }
    }

    const summary = result.data.reduce(
      (acc, timesheet) => ({
        totalHours: acc.totalHours + timesheet.total_hours,
        totalRegularHours: acc.totalRegularHours + timesheet.regular_hours,
        totalOvertimeHours: acc.totalOvertimeHours + timesheet.overtime_hours,
        totalPay: acc.totalPay + timesheet.total_pay,
        timesheetCount: acc.timesheetCount + 1,
      }),
      {
        totalHours: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalPay: 0,
        timesheetCount: 0,
      },
    )

    return {
      data: {
        ...summary,
        totalHours: Math.round(summary.totalHours * 100) / 100,
        totalRegularHours: Math.round(summary.totalRegularHours * 100) / 100,
        totalOvertimeHours: Math.round(summary.totalOvertimeHours * 100) / 100,
        totalPay: Math.round(summary.totalPay * 100) / 100,
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error calculating summary:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
