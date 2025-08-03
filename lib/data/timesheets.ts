import type {
  Timesheet,
  CreateTimesheetInput,
  UpdateTimesheetInput,
  ApiResponse,
  TimesheetFilters,
  TimesheetWithDetails,
} from "@/lib/types";

import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "./data";
import { parse } from "date-fns";

/**
 * Get timesheets with optional filtering and related data
 */
export async function getTimesheets(
  userId: string,
  filters: TimesheetFilters = {}
): Promise<ApiResponse<TimesheetWithDetails[]>> {
  const profile = await getProfile(userId);
  
  if (!profile) {
    console.log("No profile found for user:", userId);
    return {
      data: [],
      error: null,
      success: true,
    };
  }
  
  try {
    let query = supabase
      .from("timesheets")
      .select(
        `
        *,
        worker:workers(id, name, role, position, department, hourly_rate),
        project:projects(
          id, 
          name, 
          location,
          client:clients(id, name, company)
        )
      `
      )
      .order("date", { ascending: false })
      .eq("company_id", profile.company_id);

    // Apply filters
    if (filters.worker_id) {
      query = query.eq("worker_id", filters.worker_id);
    }

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id);
    }

    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }

    if (filters.supervisor_approval !== undefined) {
      query = query.eq("supervisor_approval", filters.supervisor_approval);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching timesheets:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: data as TimesheetWithDetails[],
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error fetching timesheets:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Get unapproved timesheets for a user
 */
export async function getUnapprovedTimesheets(
  userId: string
): Promise<ApiResponse<TimesheetWithDetails[]>> {
  return getTimesheets(userId, {
    supervisor_approval: "pending"
  });
}

/**
 * Get a single timesheet by ID
 */
export async function getTimesheet(
  id: string
): Promise<ApiResponse<TimesheetWithDetails>> {
  try {
    const { data, error } = await supabase
      .from("timesheets")
      .select(
        `
        *,
        worker:workers(id, name, role, position, department, hourly_rate),
        project:projects(
          id, 
          name, 
          location,
          client:clients(id, name, company)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching timesheet:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: data as TimesheetWithDetails,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error fetching timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Create a new timesheet
 */
export async function createTimesheet(
  userId: string,
  timesheet: CreateTimesheetInput
): Promise<ApiResponse<Timesheet>> {
  const profile = await getProfile(userId);
  
  if (!profile) {
    console.log("No profile found for user:", userId);
    return {
      data: null,
      error: "User profile not found",
      success: false,
    };
  }
  
  try {
    // Fetch worker's hourly rate
    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select("hourly_rate")
      .eq("id", timesheet.worker_id)
      .single();

    if (workerError || !workerData) {
      console.error("Error fetching worker hourly rate:", workerError);
      return {
        data: null,
        error: workerError?.message || "Could not fetch worker hourly rate",
        success: false,
      };
    }
    
    // Use the worker's hourly rate or default to 0 if null
    const workerHourlyRate = workerData.hourly_rate || 0;

    // Calculate totals before inserting
    const calculatedTimesheet = calculateTimesheetTotals(timesheet, workerHourlyRate);

    const { data, error } = await supabase
      .from("timesheets")
      .insert({
        ...calculatedTimesheet,
        hourly_rate: workerHourlyRate,
        company_id: profile.company_id,
        created_by: userId,
        supervisor_approval: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating timesheet:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: data as Timesheet,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error creating timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Update an existing timesheet
 */
export async function updateTimesheet(
  timesheet: UpdateTimesheetInput
): Promise<ApiResponse<Timesheet>> {
  try {
    const { id, ...updateData } = timesheet;

    // Recalculate totals if time-related fields are being updated
    const fieldsToRecalculate = [
      "clock_in",
      "clock_out",
      "break_duration",
      "hourly_rate",
    ];
    const shouldRecalculate = fieldsToRecalculate.some(
      (field) => field in updateData
    );

    let finalUpdateData = updateData;
    if (shouldRecalculate) {
      // Get current timesheet data to merge with updates
      const currentResult = await getTimesheet(id);
      if (!currentResult.success || !currentResult.data) {
        return {
          data: null,
          error: "Could not fetch current timesheet for calculation",
          success: false,
        };
      }

      const mergedData = { ...currentResult.data, ...updateData };
      // Pass worker's hourly_rate to calculateTimesheetTotals
      const workerHourlyRate = mergedData.worker?.hourly_rate || 0;
      finalUpdateData = calculateTimesheetTotals(mergedData, workerHourlyRate);
    }

    const { data, error } = await supabase
      .from("timesheets")
      .update(finalUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating timesheet:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: data as Timesheet,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error updating timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Delete a timesheet
 */
export async function deleteTimesheet(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("timesheets").delete().eq("id", id);

    if (error) {
      console.error("Error deleting timesheet:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error deleting timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Bulk update multiple timesheets (useful for supervisor approval)
 */
export async function bulkUpdateTimesheets(
  updates: { id: string; supervisor_approval?: "pending" | "approved" | "rejected"; notes?: string }[]
): Promise<ApiResponse<Timesheet[]>> {
  try {
    const results = await Promise.all(
      updates.map((update) => updateTimesheet(update))
    );

    const errors = results.filter((result) => !result.success);
    if (errors.length > 0) {
      return {
        data: null,
        error: `Failed to update ${errors.length} timesheets`,
        success: false,
      };
    }

    const data = results
      .map((result) => result.data)
      .filter(Boolean) as Timesheet[];

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in bulk update:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Helper function to calculate timesheet totals
 */
function calculateTimesheetTotals(
  timesheet: Partial<Timesheet>,
  workerHourlyRate: number
): Partial<Timesheet> {
  const clockIn = timesheet.clock_in ? parse(timesheet.clock_in, 'HH:mm', new Date()) : null;
  const clockOut = timesheet.clock_out ? parse(timesheet.clock_out, 'HH:mm', new Date()) : null;
  const breakDuration = timesheet.break_duration || 0; // in minutes

  let totalHours = 0;
  if (clockIn && clockOut) {
    const durationMs = clockOut.getTime() - clockIn.getTime();
    totalHours = durationMs / (1000 * 60 * 60) - (breakDuration / 60);
  }

  // Calculate overtime hours (anything over 8 hours)
  const overtimeHours = Math.max(0, totalHours - 8);
  const regularHours = Math.min(totalHours, 8);

  const totalPay =
    regularHours * workerHourlyRate +
    overtimeHours * workerHourlyRate * 1.5;

  return {
    ...timesheet,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    total_hours: totalHours,
    total_pay: totalPay,
  };
}

/**
 * Get timesheet summary for a date range
 */
export async function getTimesheetSummary(
  userId: string,
  filters: TimesheetFilters
): Promise<
  ApiResponse<{
    totalHours: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalPay: number;
    timesheetCount: number;
  }>
> {
  try {
    const result = await getTimesheets(userId, filters);

    if (!result.success || !result.data) {
      return {
        data: null,
        error: result.error,
        success: false,
      };
    }

    const summary = result.data.reduce(
      (acc, timesheet) => {
        const regularPay = timesheet.regular_hours * (timesheet.worker?.hourly_rate || 0);
        const overtimePay = timesheet.overtime_hours * (timesheet.worker?.hourly_rate || 0) * 1.5;
        
        return {
          totalHours: acc.totalHours + timesheet.total_hours,
          totalRegularHours: acc.totalRegularHours + timesheet.regular_hours,
          totalOvertimeHours: acc.totalOvertimeHours + timesheet.overtime_hours,
          totalPay: acc.totalPay + regularPay + overtimePay,
          timesheetCount: acc.timesheetCount + 1,
        };
      },
      {
        totalHours: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalPay: 0,
        timesheetCount: 0,
      }
    );

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
    };
  } catch (error) {
    console.error("Unexpected error calculating summary:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function approveTimesheet(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("timesheets")
      .update({ supervisor_approval: "approved" })
      .eq("id", id);

    if (error) {
      console.error("Error approving timesheet:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error approving timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}
