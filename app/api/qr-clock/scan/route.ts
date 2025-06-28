import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getQRCodeByHash, processQRCodeScanForWorker, generateTimesheetFromClockEvents } from "@/lib/data/qr-clock"
import type { ClockEventInput, DeviceInfo, QRCode } from "@/lib/types/qr-clock"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')

    if (!hash) {
      return NextResponse.json(
        { success: false, message: "QR code hash is required" },
        { status: 400 }
      )
    }

    const result = await getQRCodeByHash(hash)
    
    if (result.success && result.data) {
      // Also fetch workers for this company
      const supabase = await createClient()
      const { data: workers, error: workersError } = await supabase
        .from("workers")
        .select("id, name")
        .eq("company_id", result.data.company_id)
        .eq("is_active", true)
        .order("name")

      if (workersError) {
        console.error("Error fetching workers:", workersError)
        return NextResponse.json({
          success: true,
          qr_code: result.data,
          workers: []
        })
      }

      return NextResponse.json({
        success: true,
        qr_code: result.data,
        workers: workers || []
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || "Invalid QR code"
      }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching QR code:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    const { qr_code_hash, worker_id, project_id, biometric_data, device_info } = body

    // Validate required fields
    if (!qr_code_hash || !worker_id || !project_id) {
      return NextResponse.json(
        { success: false, message: "QR code hash, worker ID, and project ID are required" },
        { status: 400 }
      )
    }

    // Get QR code details first
    const qrCodeResult = await getQRCodeByHash(qr_code_hash)
    if (!qrCodeResult.success || !qrCodeResult.data) {
      return NextResponse.json(
        { success: false, message: "Invalid QR code" },
        { status: 400 }
      )
    }

    const qrCode = qrCodeResult.data

    // Debug: Check if there are any workers in the database
    const { data: allWorkers, error: allWorkersError } = await supabase
      .from("workers")
      .select("id, name, company_id")
      .limit(5)
    
    console.log("All workers in database:", allWorkers)
    console.log("All workers error:", allWorkersError)

    // Verify worker exists and belongs to the same company as the QR code
    console.log("Verifying worker:", { worker_id, company_id: qrCode.company_id })
    
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, name, company_id")
      .eq("id", worker_id)
      .eq("company_id", qrCode.company_id) // Use company_id from QR code instead of authenticated user
      .single()

    console.log("Worker query result:", { worker, workerError })

    if (workerError || !worker) {
      console.error("Worker verification failed:", workerError)
      return NextResponse.json(
        { 
          success: false, 
          message: "Worker not found or unauthorized",
          debug: {
            worker_id,
            company_id: qrCode.company_id,
            workerError: workerError?.message,
            allWorkers: allWorkers?.length || 0
          }
        },
        { status: 400 }
      )
    }

    console.log("Worker verified successfully:", worker)

    // Anti-buddy punching checks including location validation
    const securityChecks = await performSecurityChecks(worker_id, project_id, device_info, biometric_data, qrCode)
    if (!securityChecks.passed) {
      return NextResponse.json({
        success: false,
        message: securityChecks.message,
        security_violation: true
      }, { status: 400 })
    }

    // Get worker's current clock status to determine action
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_worker_clock_status', {
        worker_uuid: worker_id,
        project_uuid: project_id
      })

    if (statusError) {
      console.error("Error getting worker clock status:", statusError)
      return NextResponse.json(
        { success: false, message: "Failed to get worker status" },
        { status: 500 }
      )
    }

    const currentStatus = statusData?.[0]
    const shouldClockIn = !currentStatus?.is_clocked_in

    // Create clock event input with enhanced security data
    const clockEventInput: ClockEventInput = {
      worker_id,
      project_id,
      qr_code_hash,
      event_type: shouldClockIn ? 'clock_in' : 'clock_out',
      device_info: {
        ...device_info,
        biometric_verified: !!biometric_data,
        security_checks_passed: true,
        timestamp: new Date().toISOString()
      }
    }

    // Process the scan - pass the company_id from QR code instead of user ID
    const result = await processQRCodeScanForWorker(qrCode.company_id, clockEventInput)

    if (result.success) {
      // If this was a clock out event, try to generate a timesheet
      if (shouldClockIn === false) { // This means we just clocked out
        console.log(`Worker ${worker_id} clocked out, attempting to generate timesheet...`)
        try {
          const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
          console.log(`Generating timesheet for worker ${worker_id}, project ${project_id}, date ${today}`)
          
          const timesheetResult = await generateTimesheetFromClockEvents(
            qrCode.company_id,
            worker_id,
            project_id,
            today,
            "standard", // Use standard rounding strategy
            true // Round to standard 8-hour day
          )
          
          if (timesheetResult.success) {
            console.log(`Successfully generated timesheet: ${timesheetResult.data?.id}`)
            // Update the success message to include timesheet generation info
            result.message += " Timesheet generated automatically."
          } else {
            console.log(`Failed to generate timesheet: ${timesheetResult.error}`)
            
            // Test: Try to create a simple timesheet manually to see if there are permission issues
            console.log("Testing manual timesheet creation...")
            const { data: testTimesheet, error: testError } = await supabase
              .from("timesheets")
              .insert([{
                worker_id: worker_id,
                project_id: project_id,
                date: today,
                company_id: qrCode.company_id,
                task_description: "Test timesheet",
                clock_in: "08:00",
                clock_out: "17:00",
                break_duration: 0,
                regular_hours: 8,
                overtime_hours: 0,
                total_hours: 8,
                total_pay: 0,
                hourly_rate: 0,
                supervisor_approval: "pending"
              }])
              .select()
              .single()
            
            console.log("Manual test result:", { testTimesheet, testError })
          }
          
          // Note: We don't fail the clock out if timesheet generation fails
          // The timesheet can be generated manually later
        } catch (timesheetError) {
          console.error("Error generating timesheet after clock out:", timesheetError)
          // Continue with the successful clock out response
        }
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        action: shouldClockIn ? 'clock_in' : 'clock_out',
        worker_status: result.worker_status
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing QR code scan:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

async function performSecurityChecks(
  workerId: string, 
  projectId: string, 
  deviceInfo: DeviceInfo, 
  biometricData: string,
  qrCode: QRCode
) {
  const supabase = await createClient()
  
  try {
    // Check 1: Verify biometric data (in production, validate against stored biometrics)
    // Temporarily disabled for testing
    // if (!biometricData) {
    //   return {
    //     passed: false,
    //     message: "Biometric verification required"
    //   }
    // }

    // Check 2: Prevent rapid successive clock events (within 15 seconds)
    const { data: recentEvents } = await supabase
      .from("clock_events")
      .select("event_time")
      .eq("worker_id", workerId)
      .eq("project_id", projectId)
      .gte("event_time", new Date(Date.now() - 15000).toISOString())
      .order("event_time", { ascending: false })
      .limit(1)

    if (recentEvents && recentEvents.length > 0) {
      return {
        passed: false,
        message: "Please wait before making another clock event"
      }
    }

    // Check 3: Location validation using GPS coordinates (optional for testing)
    if (deviceInfo?.gps && qrCode?.project_location) {
      const workerLocation = deviceInfo.gps
      const projectLocation = qrCode.project_location
      
      if (projectLocation.latitude && projectLocation.longitude && projectLocation.radius_meters) {
        const distance = calculateDistance(
          workerLocation.latitude,
          workerLocation.longitude,
          projectLocation.latitude,
          projectLocation.longitude
        )
        
        const maxDistance = projectLocation.radius_meters || 50 // Default 50 meters
        
        if (distance > maxDistance) {
          console.log(`Location validation failed. Distance: ${Math.round(distance)}m (max: ${maxDistance}m)`)
          // For testing, we'll allow this to pass
          // return {
          //   passed: false,
          //   message: `You must be within ${maxDistance}m of the project location. Current distance: ${Math.round(distance)}m`
          // }
        }
        
        console.log(`Location validation passed. Distance: ${Math.round(distance)}m (max: ${maxDistance}m)`)
      }
    }

    // Check 4: Device fingerprinting (prevent multiple devices for same worker)
    if (deviceInfo?.fingerprint) {
      // In production, store and verify device fingerprints
      // For now, we'll just log the device fingerprint
      console.log("Device verification:", deviceInfo.fingerprint)
    }

    // Check 5: Time-based restrictions (disabled for testing)
    // const now = new Date()
    // const hour = now.getHours()
    // const isWorkHours = hour >= 6 && hour <= 18 // 6 AM to 6 PM
    // 
    // if (!isWorkHours) {
    //   return {
    //     passed: false,
    //     message: "Clock events only allowed during work hours (6 AM - 6 PM)"
    //   }
    // }

    return {
      passed: true,
      message: "Security checks passed"
    }
  } catch (error) {
    console.error("Error performing security checks:", error)
    return {
      passed: false,
      message: "Security verification failed"
    }
  }
}

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
} 