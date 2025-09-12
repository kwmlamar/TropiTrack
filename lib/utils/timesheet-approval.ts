import { format, startOfWeek, endOfWeek } from 'date-fns'
import { parseISO } from 'date-fns'

export interface TimesheetApprovalResult {
  success: boolean
  error?: string
  payrollGenerated?: boolean
}

/**
 * Generate payroll for a worker and period (same logic as in approvals page)
 */
export async function generatePayrollForWorkerAndPeriod(
  userId: string | null, 
  workerId: string, 
  weekStart: string, 
  weekEnd: string
): Promise<TimesheetApprovalResult> {
  try {
    console.log(`[TimesheetApproval] Calling generatePayrollForWorkerAndPeriod with:`, {
      userId,
      workerId,
      weekStart,
      weekEnd
    })
    
    const response = await fetch('/api/generate-payroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workerId,
        weekStart,
        weekEnd,
        userId
      })
    })
    
    console.log(`[TimesheetApproval] API response status:`, response.status)
    const result = await response.json()
    console.log(`[TimesheetApproval] API response result:`, result)
    
    if (!response.ok) {
      console.error(`[TimesheetApproval] API error:`, result)
      return { 
        success: false, 
        error: result.message || 'Failed to generate payroll',
        payrollGenerated: false
      }
    }
    
    if (!result.success) {
      console.error(`[TimesheetApproval] API returned success: false:`, result)
      return { 
        success: false, 
        error: result.message || 'Failed to generate payroll',
        payrollGenerated: false
      }
    }
    
    console.log(`[TimesheetApproval] Payroll generation successful:`, result)
    return { 
      success: true, 
      payrollGenerated: true
    }
  } catch (error) {
    console.error(`[TimesheetApproval] Error generating payroll:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      payrollGenerated: false
    }
  }
}

/**
 * Get week boundaries for a given date
 */
export function getWeekBoundaries(date: string | Date, weekStartDay: number = 6) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const weekStart = format(startOfWeek(dateObj, { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(dateObj, { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
  
  return { weekStart, weekEnd }
}

/**
 * Process timesheet approval with payroll generation
 */
export async function processTimesheetApproval(
  timesheetId: string,
  userId: string | null,
  workerId: string,
  date: string,
  weekStartDay: number = 6
): Promise<TimesheetApprovalResult> {
  try {
    console.log(`[TimesheetApproval] Processing approval for timesheet ${timesheetId}`)
    
    // First, approve the timesheet
    const approveResponse = await fetch(`/api/approvals/${timesheetId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!approveResponse.ok) {
      const errorData = await approveResponse.json()
      console.error(`[TimesheetApproval] Failed to approve timesheet:`, errorData)
      return { 
        success: false, 
        error: errorData.message || 'Failed to approve timesheet',
        payrollGenerated: false
      }
    }
    
    console.log(`[TimesheetApproval] Timesheet ${timesheetId} approved successfully`)
    
    // Then generate payroll for the worker and period
    const { weekStart, weekEnd } = getWeekBoundaries(date, weekStartDay)
    const payrollResult = await generatePayrollForWorkerAndPeriod(userId, workerId, weekStart, weekEnd)
    
    if (!payrollResult.success) {
      console.warn(`[TimesheetApproval] Timesheet approved but payroll generation failed:`, payrollResult.error)
      // Don't fail the whole operation if payroll generation fails
      return {
        success: true,
        error: `Timesheet approved but payroll generation failed: ${payrollResult.error}`,
        payrollGenerated: false
      }
    }
    
    console.log(`[TimesheetApproval] Successfully processed approval for timesheet ${timesheetId}`)
    return {
      success: true,
      payrollGenerated: true
    }
  } catch (error) {
    console.error(`[TimesheetApproval] Error processing timesheet approval:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      payrollGenerated: false
    }
  }
}
