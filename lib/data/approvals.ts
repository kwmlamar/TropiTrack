import type { ApiResponse, TimesheetWithDetails } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "./data";

/**
 * Get all unapproved timesheets for a company
 */
export async function getUnapprovedTimesheets(
  userId: string
): Promise<ApiResponse<TimesheetWithDetails[]>> {
  try {
    const profile = await getProfile(userId);
    if (!profile) {
      return {
        data: null,
        error: "User profile not found",
        success: false,
      };
    }

    const { data, error } = await supabase
      .from("timesheets")
      .select(`
        *,
        worker:workers(id, name, role, position, department, hourly_rate),
        project:projects(id, name, location)
      `)
      .eq("company_id", profile.company_id)
      .eq("supervisor_approval", "pending")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching unapproved timesheets:", error);
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
    console.error("Error fetching unapproved timesheets:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Approve a timesheet
 */
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

/**
 * Reject a timesheet
 */
export async function rejectTimesheet(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("timesheets")
      .update({ supervisor_approval: "rejected" })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting timesheet:", error);
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
    console.error("Unexpected error rejecting timesheet:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

/**
 * Bulk approve multiple timesheets
 */
export async function bulkApproveTimesheets(
  ids: string[]
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("timesheets")
      .update({ supervisor_approval: "approved" })
      .in("id", ids);

    if (error) {
      console.error("Error bulk approving timesheets:", error);
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
    console.error("Unexpected error bulk approving timesheets:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
} 