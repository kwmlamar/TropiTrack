import type { 
  ProjectLocation, 
  QRCode, 
  ClockEvent, 
  NewProjectLocation, 
  NewQRCode, 
  ClockEventInput,
  WorkerClockStatus,
  QRCodeScanResponse
} from "@/lib/types/qr-clock"
import type { ApiResponse, Timesheet } from "@/lib/types"
import { getProfile } from "./data"
import { supabase } from "@/lib/supabaseClient"
import { completeOnboardingStep } from "@/lib/actions/onboarding-actions";

/**
 * Get project locations for a company
 */
export async function getProjectLocations(companyId: string): Promise<ApiResponse<ProjectLocation[]>> {
  try {
    const { data, error } = await supabase
      .from("project_locations")
      .select(`
        *,
        project:projects(id, name),
        qr_code:qr_codes(*)
      `)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project locations:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectLocation[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project locations:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Create a new project location
 */
export async function createProjectLocation(
  userId: string, 
  location: NewProjectLocation
): Promise<ApiResponse<ProjectLocation>> {
  const profile = await getProfile(userId)

  try {
    const { data, error } = await supabase
      .from("project_locations")
      .insert([{ 
        ...location, 
        company_id: profile.company_id, 
        created_by: userId 
      }])
      .select(`
        *,
        project:projects(id, name)
      `)
      .single()

    if (error) {
      console.error("Error creating project location:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ProjectLocation, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating project location:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Generate a new QR code
 */
export async function generateQRCode(
  userId: string, 
  qrCode: NewQRCode
): Promise<ApiResponse<QRCode>> {
  const profile = await getProfile(userId)

  try {
    // Generate unique hash for the QR code locally
    const timestamp = Date.now()
    const randomBytes = crypto.getRandomValues(new Uint8Array(8))
    const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    const hashData = `QR_${randomHex}_${timestamp}`

    const { data, error } = await supabase
      .from("qr_codes")
      .insert([{ 
        ...qrCode, 
        qr_type: qrCode.qr_type || 'clock_in', // Default to clock_in for general QR codes
        code_hash: hashData,
        company_id: profile.company_id, 
        created_by: userId 
      }])
      .select(`
        *,
        project_location:project_locations(*)
      `)
      .single()

    if (error) {
      console.error("Error creating QR code:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as QRCode, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error creating QR code:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get QR code by hash
 */
export async function getQRCodeByHash(codeHash: string): Promise<ApiResponse<QRCode>> {
  try {
    const { data, error } = await supabase
      .from("qr_codes")
      .select(`
        *,
        project_location:project_locations(
          *,
          project:projects(id, name)
        )
      `)
      .eq("code_hash", codeHash)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Error fetching QR code:", error)
      return { data: null, error: error.message, success: false }
    }

    // Check if QR code has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { data: null, error: "QR code has expired", success: false }
    }

    return { data: data as QRCode, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching QR code:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Process QR code scan and create clock event
 */
export async function processQRCodeScan(
  userId: string,
  scanData: ClockEventInput
): Promise<QRCodeScanResponse> {
  try {
    // Get QR code details
    const qrCodeResult = await getQRCodeByHash(scanData.qr_code_hash)
    if (!qrCodeResult.success || !qrCodeResult.data) {
      return {
        success: false,
        message: "Invalid QR code",
        error: qrCodeResult.error || "Unknown error"
      }
    }

    const qrCode = qrCodeResult.data

    // Verify worker exists and belongs to company
    const profile = await getProfile(userId)
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, name, company_id")
      .eq("id", scanData.worker_id)
      .eq("company_id", profile.company_id)
      .single()

    if (workerError || !worker) {
      return {
        success: false,
        message: "Worker not found or unauthorized",
        error: "Invalid worker ID"
      }
    }

    // Get worker's current clock status
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_worker_clock_status', {
        worker_uuid: scanData.worker_id,
        project_uuid: scanData.project_id
      })

    if (statusError) {
      console.error("Error getting worker clock status:", statusError)
    }

    const currentStatus = statusData?.[0] as WorkerClockStatus | undefined

    // Validate clock event logic
    const validationError = validateClockEvent(qrCode.qr_type, currentStatus)
    if (validationError) {
      return {
        success: false,
        message: validationError,
        worker_status: currentStatus
      }
    }

    // Create clock event
    const { error: eventError } = await supabase
      .from("clock_events")
      .insert([{
        worker_id: scanData.worker_id,
        project_id: scanData.project_id,
        project_location_id: qrCode.project_location_id,
        qr_code_id: qrCode.id,
        event_type: scanData.event_type,
        device_info: scanData.device_info,
        notes: scanData.notes
      }])
      .select(`
        *,
        worker:workers(id, name),
        project:projects(id, name),
        project_location:project_locations(*),
        qr_code:qr_codes(*)
      `)
      .single()

    if (eventError) {
      console.error("Error creating clock event:", eventError)
      return {
        success: false,
        message: "Failed to record clock event",
        error: eventError.message
      }
    }

    // Get updated worker status
    const { data: newStatusData } = await supabase
      .rpc('get_worker_clock_status', {
        worker_uuid: scanData.worker_id,
        project_uuid: scanData.project_id
      })

    const newStatus = newStatusData?.[0] as WorkerClockStatus | undefined

    return {
      success: true,
      message: getSuccessMessage(qrCode.qr_type),
      worker_status: newStatus
    }
  } catch (error) {
    console.error("Unexpected error processing QR code scan:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Process QR code scan and create clock event (for workers without authentication)
 */
export async function processQRCodeScanForWorker(
  companyId: string,
  scanData: ClockEventInput
): Promise<QRCodeScanResponse> {
  try {
    // Get QR code details
    const qrCodeResult = await getQRCodeByHash(scanData.qr_code_hash)
    if (!qrCodeResult.success || !qrCodeResult.data) {
      return {
        success: false,
        message: "Invalid QR code",
        error: qrCodeResult.error || "Unknown error"
      }
    }

    const qrCode = qrCodeResult.data

    // Verify worker exists and belongs to company
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, name, company_id")
      .eq("id", scanData.worker_id)
      .eq("company_id", companyId)
      .single()

    if (workerError || !worker) {
      return {
        success: false,
        message: "Worker not found or unauthorized",
        error: workerError?.message || "Worker verification failed"
      }
    }

    // Get worker's current clock status
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_worker_clock_status', {
        worker_uuid: scanData.worker_id,
        project_uuid: scanData.project_id
      })

    if (statusError) {
      console.error("Error getting worker clock status:", statusError)
      return {
        success: false,
        message: "Failed to get worker status",
        error: statusError.message
      }
    }

    const currentStatus = statusData?.[0]

    // Validate clock event
    const validationError = validateClockEvent(scanData.event_type, currentStatus)
    if (validationError) {
      return {
        success: false,
        message: validationError,
        error: "Invalid clock event"
      }
    }

    // Create clock event
    const { error: insertError } = await supabase
      .from("clock_events")
      .insert([{
        worker_id: scanData.worker_id,
        project_id: scanData.project_id,
        qr_code_id: qrCode.id,
        event_type: scanData.event_type,
        event_time: new Date().toISOString(),
        device_info: scanData.device_info,
        company_id: companyId
      }])
      .select()
      .single()

    if (insertError) {
      console.error("Error creating clock event:", insertError)
      return {
        success: false,
        message: "Failed to record clock event",
        error: insertError.message
      }
    }

    // Get updated worker status
    const { data: updatedStatus } = await supabase
      .rpc('get_worker_clock_status', {
        worker_uuid: scanData.worker_id,
        project_uuid: scanData.project_id
      })

    return {
      success: true,
      message: getSuccessMessage(scanData.event_type),
      worker_status: updatedStatus?.[0] || null
    }
  } catch (error) {
    console.error("Unexpected error processing QR code scan:", error)
    return {
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Get clock events for a worker
 */
export async function getWorkerClockEvents(
  companyId: string,
  workerId: string,
  projectId?: string,
  date?: string
): Promise<ApiResponse<ClockEvent[]>> {
  console.log(`[DEBUG] Fetching clock events for worker ${workerId}, project ${projectId}, date ${date}`)
  
  try {
    let query = supabase
      .from("clock_events")
      .select(`
        *,
        worker:workers(id, name),
        project:projects(id, name),
        project_location:project_locations(*),
        qr_code:qr_codes(*)
      `)
      .eq("worker_id", workerId)

    if (projectId) {
      query = query.eq("project_id", projectId)
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      query = query.gte("event_time", startOfDay.toISOString())
      query = query.lte("event_time", endOfDay.toISOString())
      
      console.log(`[DEBUG] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`)
    }

    const { data, error } = await query.order("event_time", { ascending: false })

    if (error) {
      console.error("[DEBUG] Error fetching clock events:", error)
      return { data: null, error: error.message, success: false }
    }

    console.log(`[DEBUG] Found ${data?.length || 0} clock events`)
    if (data && data.length > 0) {
      console.log(`[DEBUG] Clock events:`, data.map(e => ({ 
        id: e.id, 
        type: e.event_type, 
        time: e.event_time,
        worker: e.worker?.name,
        project: e.project?.name
      })))
    }

    return { data: data as ClockEvent[], error: null, success: true }
  } catch (error) {
    console.error("[DEBUG] Unexpected error fetching clock events:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Get QR codes for a company
 */
export async function getQRCodes(companyId: string): Promise<ApiResponse<QRCode[]>> {
  try {
    const { data, error } = await supabase
      .from("qr_codes")
      .select(`
        *,
        project_location:project_locations(
          *,
          project:projects(id, name)
        )
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching QR codes:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as QRCode[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching QR codes:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Update a QR code
 */
export async function updateQRCode(
  userId: string,
  qrCodeId: string,
  updates: Partial<NewQRCode>
): Promise<ApiResponse<QRCode>> {
  try {
    const { data, error } = await supabase
      .from("qr_codes")
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", qrCodeId)
      .select(`
        *,
        project_location:project_locations(*)
      `)
      .single()

    if (error) {
      console.error("Error updating QR code:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as QRCode, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error updating QR code:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Delete a project location
 */
export async function deleteProjectLocation(
  userId: string, 
  locationId: string
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from("project_locations")
      .delete()
      .eq("id", locationId)

    if (error) {
      console.error("Error deleting project location:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: null, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting project location:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

// Helper functions
function validateClockEvent(
  qrType: string, 
  currentStatus?: WorkerClockStatus
): string | undefined {
  if (!currentStatus) {
    // No previous events today, only allow clock_in
    if (qrType !== 'clock_in') {
      return "You must clock in first before using other QR codes"
    }
    return undefined
  }

  switch (qrType) {
    case 'clock_in':
      if (currentStatus.is_clocked_in) {
        return "You are already clocked in"
      }
      break
    case 'clock_out':
      if (!currentStatus.is_clocked_in) {
        return "You must be clocked in to clock out"
      }
      break
  }

  return undefined
}

function getSuccessMessage(qrType: string): string {
  switch (qrType) {
    case 'clock_in':
      return "Successfully clocked in"
    case 'clock_out':
      return "Successfully clocked out"
    default:
      return "Event recorded successfully"
  }
}

/**
 * Generate timesheet from clock events for a worker on a specific date
 */
export async function generateTimesheetFromClockEvents(
  companyId: string,
  workerId: string,
  projectId: string,
  date: string,
  roundingStrategy: string = "standard",
  roundToStandard: boolean = true
): Promise<ApiResponse<Timesheet>> {
  console.log(`[DEBUG] Starting timesheet generation for worker ${workerId}, project ${projectId}, date ${date}`)
  
  try {
    // Get all clock events for the worker on the specified date
    const clockEventsResult = await getWorkerClockEvents(companyId, workerId, projectId, date)
    
    if (!clockEventsResult.success || !clockEventsResult.data) {
      console.log(`[DEBUG] Failed to fetch clock events: ${clockEventsResult.error}`)
      return {
        data: null,
        error: clockEventsResult.error || "Failed to fetch clock events",
        success: false
      }
    }

    const clockEvents = clockEventsResult.data
    console.log(`[DEBUG] Found ${clockEvents.length} clock events for the date`)

    // Check if timesheet already exists for this worker/project/date
    const { data: existingTimesheet } = await supabase
      .from("timesheets")
      .select("id")
      .eq("worker_id", workerId)
      .eq("project_id", projectId)
      .eq("date", date)
      .single()

    if (existingTimesheet) {
      console.log(`[DEBUG] Timesheet already exists for worker ${workerId} on ${date}`)
      return {
        data: null,
        error: "Timesheet already exists for this worker on this date",
        success: false
      }
    }

    // Get worker details for hourly rate
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, name, hourly_rate")
      .eq("id", workerId)
      .single()

    if (workerError || !worker) {
      console.log(`[DEBUG] Worker not found: ${workerError?.message}`)
      return {
        data: null,
        error: "Worker not found",
        success: false
      }
    }

    console.log(`[DEBUG] Worker found: ${worker.name}, hourly rate: ${worker.hourly_rate}`)

    // Process clock events to calculate hours
    const timesheetData = processClockEventsToTimesheet(clockEvents, worker.hourly_rate || 0, roundingStrategy, roundToStandard)
    
    if (!timesheetData) {
      console.log(`[DEBUG] No valid timesheet data generated from clock events`)
      return {
        data: null,
        error: "No valid clock in/out pairs found for timesheet generation",
        success: false
      }
    }

    console.log(`[DEBUG] Timesheet data generated:`, timesheetData)

    // Check if approval is required based on company settings
    const { getTimesheetSettingsRequireApproval } = await import("@/lib/data/timesheet-settings");
    const requireApproval = await getTimesheetSettingsRequireApproval();
    const approvalStatus = requireApproval ? "pending" : "approved";

    // Create timesheet entry
    const { data: timesheet, error: insertError } = await supabase
      .from("timesheets")
      .insert([{
        ...timesheetData,
        worker_id: workerId,
        project_id: projectId,
        date: date,
        company_id: companyId,
        supervisor_approval: approvalStatus
      }])
      .select()
      .single()

    if (insertError) {
      console.error(`[DEBUG] Error creating timesheet:`, insertError)
      return {
        data: null,
        error: insertError.message,
        success: false
      }
    }

    console.log(`[DEBUG] Successfully created timesheet: ${timesheet.id}`)

    // Complete the timesheets onboarding step
    try {
      // Get the user ID from the worker's profile
      const { data: workerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("company_id", companyId)
        .eq("role", "admin")
        .single();

      if (!profileError && workerProfile) {
        await completeOnboardingStep(workerProfile.user_id, 'timesheets', {
          timesheet_id: timesheet.id,
          created_at: new Date().toISOString(),
          source: 'qr_clock'
        });
        console.log('Onboarding step "timesheets" completed for QR clock timesheet');
      }
    } catch (onboardingError) {
      console.error('Error completing timesheets onboarding step:', onboardingError);
      // Don't fail the timesheet creation if onboarding completion fails
    }

    return {
      data: timesheet as Timesheet,
      error: null,
      success: true
    }
  } catch (error) {
    console.error(`[DEBUG] Unexpected error generating timesheet:`, error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Process clock events to calculate timesheet data
 */
function processClockEventsToTimesheet(
  clockEvents: ClockEvent[],
  hourlyRate: number,
  roundingStrategy: string = "standard",
  roundToStandard: boolean = true
): Partial<Timesheet> | null {
  console.log(`[DEBUG] Processing ${clockEvents.length} clock events for timesheet generation`)
  console.log(`[DEBUG] Clock events:`, clockEvents.map(e => ({ type: e.event_type, time: e.event_time })))
  
  // Sort events by time
  const sortedEvents = clockEvents.sort((a, b) => 
    new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
  )

  let totalMinutes = 0
  let clockInTime: string | null = null
  let clockOutTime: string | null = null
  let firstClockIn: string | null = null
  let lastClockOut: string | null = null

  // Process events to find clock in/out pairs
  for (const event of sortedEvents) {
    if (event.event_type === 'clock_in') {
      if (!clockInTime) {
        clockInTime = event.event_time
        firstClockIn = event.event_time
        console.log(`[DEBUG] Found clock in: ${event.event_time}`)
      }
    } else if (event.event_type === 'clock_out') {
      if (clockInTime) {
        clockOutTime = event.event_time
        lastClockOut = event.event_time
        
        // Calculate minutes between clock in and out
        const clockIn = new Date(clockInTime)
        const clockOut = new Date(clockOutTime)
        const minutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60)
        totalMinutes += minutes
        
        console.log(`[DEBUG] Found clock out: ${event.event_time}, calculated ${minutes} minutes`)
        
        // Reset for next pair
        clockInTime = null
        clockOutTime = null
      }
    }
  }

  // If worker is still clocked in, use current time as clock out
  if (clockInTime && !clockOutTime) {
    const now = new Date()
    const clockIn = new Date(clockInTime)
    const minutes = (now.getTime() - clockIn.getTime()) / (1000 * 60)
    totalMinutes += minutes
    lastClockOut = now.toISOString()
    console.log(`[DEBUG] Worker still clocked in, using current time, added ${minutes} minutes`)
  }

  console.log(`[DEBUG] Total minutes calculated: ${totalMinutes}`)

  if (totalMinutes <= 0) {
    console.log(`[DEBUG] No valid time calculated, returning null`)
    return null
  }

  // Convert to hours and apply rounding logic
  const rawHours = totalMinutes / 60
  const { totalHours, regularHours, overtimeHours } = calculateAdjustedHours(rawHours, roundingStrategy, roundToStandard)

  console.log(`[DEBUG] Raw hours: ${rawHours}, adjusted hours: ${totalHours}, regular: ${regularHours}, overtime: ${overtimeHours}`)

  // Calculate pay
  const totalPay = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5

  // Format times for display
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const result = {
    clock_in: firstClockIn ? formatTime(firstClockIn) : "00:00",
    clock_out: lastClockOut ? formatTime(lastClockOut) : "00:00",
    break_duration: 0, // Could be enhanced to detect break events
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    total_hours: totalHours,
    total_pay: totalPay,
    hourly_rate: hourlyRate,
    task_description: "Auto-generated from QR clock events",
    notes: `Generated from ${clockEvents.length} clock events (raw: ${rawHours.toFixed(2)}h, adjusted: ${totalHours.toFixed(2)}h, strategy: ${roundingStrategy})`
  }

  console.log(`[DEBUG] Generated timesheet data:`, result)
  return result
}

/**
 * Calculate adjusted hours with rounding and standard work period logic
 */
function calculateAdjustedHours(
  rawHours: number, 
  roundingStrategy: string = "standard",
  roundToStandard: boolean = true
): {
  totalHours: number
  regularHours: number
  overtimeHours: number
} {
  const STANDARD_WORK_DAY = 8 // Standard 8-hour work day
  const ROUNDING_THRESHOLD = 0.15 // 9 minutes (0.15 hours) threshold for rounding
  const MIN_WORK_HOURS = 0.01 // Minimum 0.6 minutes to count as work (very low for testing)
  const MAX_ROUND_TO_STANDARD = 0.5 // Maximum 30 minutes over standard to round down to 8 hours
  const SHORT_WORK_THRESHOLD = 0.5 // If less than 30 minutes, don't apply standard rounding

  let adjustedHours = rawHours

  // For very short work periods, use exact time without standard rounding
  if (rawHours < SHORT_WORK_THRESHOLD) {
    console.log(`[DEBUG] Short work period (${rawHours}h), using exact time without standard rounding`)
    switch (roundingStrategy) {
      case "no_rounding":
        adjustedHours = rawHours
        break
      case "quarter_hour":
        adjustedHours = Math.round(rawHours * 4) / 4
        break
      case "exact":
        adjustedHours = Math.round(rawHours * 60) / 60
        break
      case "standard":
      default:
        // For short periods, just round to nearest minute
        adjustedHours = Math.round(rawHours * 60) / 60
        break
    }
  } else {
    // Normal rounding logic for longer periods
    switch (roundingStrategy) {
      case "no_rounding":
        // Use exact hours without any rounding
        break
        
      case "quarter_hour":
        // Round to nearest 15-minute increment (0.25 hours)
        adjustedHours = Math.round(adjustedHours * 4) / 4
        break
        
      case "exact":
        // Round to nearest minute (0.0167 hours)
        adjustedHours = Math.round(adjustedHours * 60) / 60
        break
        
      case "standard":
      default:
        // Standard rounding logic
        // Round to nearest 15-minute increment first
        const roundedToQuarter = Math.round(adjustedHours * 4) / 4

        if (roundToStandard) {
          // Apply rounding logic based on proximity to standard work day
          if (Math.abs(roundedToQuarter - STANDARD_WORK_DAY) <= ROUNDING_THRESHOLD) {
            // If within 9 minutes of 8 hours, round to exactly 8 hours
            adjustedHours = STANDARD_WORK_DAY
          } else if (roundedToQuarter > STANDARD_WORK_DAY && 
                     roundedToQuarter <= STANDARD_WORK_DAY + MAX_ROUND_TO_STANDARD) {
            // If between 8-8.5 hours, round down to 8 hours (manager's discretion)
            adjustedHours = STANDARD_WORK_DAY
          } else {
            // Otherwise use the rounded quarter-hour value
            adjustedHours = roundedToQuarter
          }
        } else {
          // Just round to quarter hour without standard day adjustments
          adjustedHours = roundedToQuarter
        }
        break
    }
  }

  // Ensure minimum work hours (but don't force it to be too high)
  if (adjustedHours < MIN_WORK_HOURS) {
    adjustedHours = MIN_WORK_HOURS
  }

  // Calculate regular vs overtime hours
  const overtimeHours = Math.max(0, adjustedHours - STANDARD_WORK_DAY)
  const regularHours = Math.min(adjustedHours, STANDARD_WORK_DAY)

  console.log(`[DEBUG] Rounding calculation: raw=${rawHours}h, adjusted=${adjustedHours}h, regular=${regularHours}h, overtime=${overtimeHours}h`)

  return {
    totalHours: adjustedHours,
    regularHours,
    overtimeHours
  }
}

/**
 * Generate timesheets for all workers on a specific date
 */
export async function generateTimesheetsForDate(
  companyId: string,
  projectId: string,
  date: string,
  roundingStrategy: string = "standard",
  roundToStandard: boolean = true
): Promise<ApiResponse<{ created: number; errors: string[] }>> {
  try {
    // Get all workers for the company
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id")
      .eq("company_id", companyId)
      .eq("is_active", true)

    if (workersError || !workers) {
      return {
        data: null,
        error: "Failed to fetch workers",
        success: false
      }
    }

    const results = await Promise.allSettled(
      workers.map(worker => 
        generateTimesheetFromClockEvents(companyId, worker.id, projectId, date, roundingStrategy, roundToStandard)
      )
    )

    const created = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    const errors = results
      .filter(result => result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success))
      .map(result => 
        result.status === 'rejected' 
          ? 'Unknown error' 
          : result.value.error || 'Unknown error'
      )

    return {
      data: { created, errors },
      error: null,
      success: true
    }
  } catch (error) {
    console.error("Unexpected error generating timesheets:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Generate automatic clock outs for workers who haven't clocked out
 */
export async function generateAutomaticClockOuts(
  companyId: string,
  cutoffTime: string = "23:59:59"
): Promise<ApiResponse<{ processed: number; errors: string[] }>> {
  try {
    // Get all active clock-ins that haven't been clocked out
    const { data: activeClockIns, error: fetchError } = await supabase
      .from("clock_events")
      .select(`
        *,
        worker:workers(id, name),
        qr_code:qr_codes(*)
      `)
      .eq("company_id", companyId)
      .eq("event_type", "clock_in")
      .is("clock_out_time", null)
      .is("deleted_at", null)

    if (fetchError) {
      console.error("Error fetching active clock-ins:", fetchError)
      return { data: null, error: fetchError.message, success: false }
    }

    if (!activeClockIns || activeClockIns.length === 0) {
      return { 
        data: { processed: 0, errors: [] }, 
        error: null, 
        success: true 
      }
    }

    const errors: string[] = []
    let processed = 0

    for (const clockIn of activeClockIns) {
      try {
        // Create automatic clock out
        const { error: insertError } = await supabase
          .from("clock_events")
          .insert([{
            worker_id: clockIn.worker_id,
            project_id: clockIn.project_id,
            qr_code_id: clockIn.qr_code_id,
            company_id: companyId,
            event_type: "clock_out",
            clock_in_time: clockIn.clock_in_time,
            clock_out_time: `${new Date().toISOString().split('T')[0]}T${cutoffTime}`,
            notes: "Automatic clock out",
            is_automatic: true,
            created_by: "system"
          }])

        if (insertError) {
          errors.push(`Failed to create auto clock-out for ${clockIn.worker?.name}: ${insertError.message}`)
        } else {
          processed++
        }
      } catch (error) {
        errors.push(`Error processing auto clock-out for ${clockIn.worker?.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { 
      data: { processed, errors }, 
      error: null, 
      success: true 
    }
  } catch (error) {
    console.error("Unexpected error generating automatic clock outs:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

/**
 * Test function for timesheet calculation
 */
export async function testTimesheetCalculation(): Promise<void> {
  console.log("Testing timesheet calculation...")
  
  // Mock data for testing
  const mockClockEvents = [
    {
      id: "1",
      worker_id: "test-worker",
      project_id: "test-project",
      event_type: "clock_in",
      clock_in_time: "2024-01-01T08:00:00Z",
      clock_out_time: "2024-01-01T17:00:00Z",
      notes: "Test clock event"
    }
  ]

  const result = processClockEventsToTimesheet(
    mockClockEvents as unknown as ClockEvent[],
    25.00,
    "standard",
    true
  )

  console.log("Timesheet calculation test result:", result)
}

/**
 * Test function for time restrictions
 */
export async function testTimeRestrictions(): Promise<void> {
  console.log("Testing time restrictions...")
  
  // Test various time scenarios
  const testTimes = [
    "08:00:00",
    "12:00:00", 
    "17:00:00",
    "23:59:59"
  ]

  testTimes.forEach(time => {
    const isValid = time >= "06:00:00" && time <= "23:59:59"
    console.log(`Time ${time} is ${isValid ? 'valid' : 'invalid'}`)
  })
}

/**
 * Test function for automatic clock out
 */
export async function testAutomaticClockOut(): Promise<void> {
  console.log("Testing automatic clock out...")
  
  try {
    // Test with a mock company ID
    const result = await generateAutomaticClockOuts("test-company-id")
    console.log("Automatic clock out test result:", result)
  } catch (error) {
    console.error("Automatic clock out test failed:", error)
  }
}