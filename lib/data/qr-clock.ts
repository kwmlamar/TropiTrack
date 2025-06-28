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
import type { ApiResponse } from "@/lib/types"
import { getProfile } from "./data"
import { supabase } from "@/lib/supabaseClient"

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
        project_location:project_locations(*)
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
    const { data: event, error: eventError } = await supabase
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
      event: event as ClockEvent,
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
 * Get clock events for a worker
 */
export async function getWorkerClockEvents(
  companyId: string,
  workerId: string,
  projectId?: string,
  date?: string
): Promise<ApiResponse<ClockEvent[]>> {
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
    }

    const { data, error } = await query.order("event_time", { ascending: false })

    if (error) {
      console.error("Error fetching clock events:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as ClockEvent[], error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching clock events:", error)
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
        project_location:project_locations(*)
      `)
      .eq("company_id", companyId)
      .eq("is_active", true)
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
      if (currentStatus.current_break_start) {
        return "You must end your break before clocking out"
      }
      break
    case 'break_start':
      if (!currentStatus.is_clocked_in) {
        return "You must be clocked in to start a break"
      }
      if (currentStatus.current_break_start) {
        return "You are already on a break"
      }
      break
    case 'break_end':
      if (!currentStatus.current_break_start) {
        return "You are not currently on a break"
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
    case 'break_start':
      return "Break started"
    case 'break_end':
      return "Break ended"
    default:
      return "Event recorded successfully"
  }
} 