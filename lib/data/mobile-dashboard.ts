import type { ApiResponse } from "@/lib/types"
import { supabase } from "@/lib/supabaseClient"

/**
 * Mobile Dashboard Data Types
 *
 * Designed for admin/owner users who log hours on behalf of workers.
 * Workers are assigned to projects dynamically day by day.
 */
export interface TodayStats {
  /** Number of timesheet entries created today */
  entriesToday: number
  /** Number of unique workers with hours logged today */
  workersLogged: number
  /** Total hours logged today across all entries */
  totalHours: number
}

export interface PendingApprovals {
  /** Number of entries awaiting approval */
  count: number
  /** Whether approval workflow is enabled */
  enabled: boolean
}

export interface MobileDashboardData {
  todayStats: TodayStats
  pendingApprovals: PendingApprovals
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

/**
 * Get today's stats for the mobile dashboard
 *
 * Fetches:
 * - Number of timesheet entries created today
 * - Number of unique workers with hours logged
 * - Total hours logged across all entries
 */
export async function getTodayStats(
  companyId: string
): Promise<ApiResponse<TodayStats>> {
  try {
    const today = getTodayDateString()

    // Get today's timesheets with worker info
    const { data: timesheets, error: timesheetsError } = await supabase
      .from("timesheets")
      .select("id, worker_id, total_hours")
      .eq("company_id", companyId)
      .eq("date", today)

    if (timesheetsError) {
      console.error("Error fetching timesheets:", timesheetsError)
      return { data: null, error: timesheetsError.message, success: false }
    }

    // Calculate stats
    const entriesToday = timesheets?.length || 0

    // Count unique workers
    const uniqueWorkers = new Set<string>()
    let totalHours = 0

    if (timesheets) {
      timesheets.forEach((ts) => {
        if (ts.worker_id) {
          uniqueWorkers.add(ts.worker_id)
        }
        totalHours += ts.total_hours || 0
      })
    }

    return {
      data: {
        entriesToday,
        workersLogged: uniqueWorkers.size,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching today stats:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get pending approvals count for the mobile dashboard
 */
export async function getPendingApprovals(
  companyId: string
): Promise<ApiResponse<PendingApprovals>> {
  try {
    // Check if approval workflow is enabled via timesheet settings
    const { data: settings } = await supabase
      .from("timesheet_settings")
      .select("require_approval")
      .eq("company_id", companyId)
      .single()

    const approvalEnabled = settings?.require_approval ?? false

    if (!approvalEnabled) {
      return {
        data: { count: 0, enabled: false },
        error: null,
        success: true,
      }
    }

    // Count pending approvals
    const { data: pending, error: pendingError } = await supabase
      .from("timesheets")
      .select("id", { count: "exact" })
      .eq("company_id", companyId)
      .eq("supervisor_approval", "pending")

    if (pendingError) {
      console.error("Error fetching pending approvals:", pendingError)
      return { data: null, error: pendingError.message, success: false }
    }

    return {
      data: {
        count: pending?.length || 0,
        enabled: true,
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching pending approvals:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get all mobile dashboard data in a single call
 *
 * Fetches today's stats and pending approvals for the admin dashboard.
 */
export async function getMobileDashboardData(
  companyId: string
): Promise<ApiResponse<MobileDashboardData>> {
  try {
    const [statsResult, approvalsResult] = await Promise.all([
      getTodayStats(companyId),
      getPendingApprovals(companyId),
    ])

    if (!statsResult.success || !statsResult.data) {
      return {
        data: null,
        error: statsResult.error || "Failed to fetch stats",
        success: false,
      }
    }

    return {
      data: {
        todayStats: statsResult.data,
        pendingApprovals: approvalsResult.data || { count: 0, enabled: false },
      },
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching mobile dashboard data:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
