import { supabase } from "@/lib/supabaseClient"
import type { ApiResponse } from "@/lib/types"

/**
 * Set a PIN for a worker
 */
export async function setWorkerPin(
  userId: string,
  workerId: string,
  pin: string
): Promise<ApiResponse<boolean>> {
  try {
    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return {
        data: false,
        error: "PIN must be exactly 4 digits",
        success: false
      }
    }

    const { data, error } = await supabase.rpc('set_worker_pin', {
      worker_uuid: workerId,
      new_pin: pin
    })

    if (error) {
      console.error("Error setting worker PIN:", error)
      return { data: false, error: error.message, success: false }
    }

    return { data: data as boolean, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error setting worker PIN:", error)
    return {
      data: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    }
  }
}

/**
 * Verify a worker's PIN
 */
export async function verifyWorkerPin(
  workerId: string,
  pin: string
): Promise<ApiResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('verify_worker_pin', {
      worker_uuid: workerId,
      provided_pin: pin
    })

    if (error) {
      console.error("Error verifying worker PIN:", error)
      return { data: false, error: error.message, success: false }
    }

    return { data: data as boolean, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error verifying worker PIN:", error)
    return {
      data: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    }
  }
}

/**
 * Reset a worker's PIN
 */
export async function resetWorkerPin(
  userId: string,
  workerId: string
): Promise<ApiResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('reset_worker_pin', {
      worker_uuid: workerId
    })

    if (error) {
      console.error("Error resetting worker PIN:", error)
      return { data: false, error: error.message, success: false }
    }

    return { data: data as boolean, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error resetting worker PIN:", error)
    return {
      data: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    }
  }
}

/**
 * Check if a worker has a PIN set
 */
export async function hasWorkerPin(workerId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data, error } = await supabase
      .from("workers")
      .select("pin_hash")
      .eq("id", workerId)
      .single()

    if (error) {
      console.error("Error checking worker PIN status:", error)
      return { data: false, error: error.message, success: false }
    }

    return { data: !!data.pin_hash, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error checking worker PIN status:", error)
    return {
      data: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    }
  }
}

/**
 * Get worker PIN status (for admin purposes)
 */
export async function getWorkerPinStatus(workerId: string): Promise<ApiResponse<{
  hasPin: boolean
  pinSetAt?: string
  pinLastUsed?: string
  isLocked: boolean
  attempts: number
}>> {
  try {
    const { data, error } = await supabase
      .from("workers")
      .select("pin_hash, pin_set_at, pin_last_used, pin_locked_until, pin_attempts")
      .eq("id", workerId)
      .single()

    if (error) {
      console.error("Error getting worker PIN status:", error)
      return { data: null, error: error.message, success: false }
    }

    const currentTime = new Date()
    const lockedUntil = data.pin_locked_until ? new Date(data.pin_locked_until) : null

    return {
      data: {
        hasPin: !!data.pin_hash,
        pinSetAt: data.pin_set_at,
        pinLastUsed: data.pin_last_used,
        isLocked: lockedUntil ? lockedUntil > currentTime : false,
        attempts: data.pin_attempts || 0
      },
      error: null,
      success: true
    }
  } catch (error) {
    console.error("Unexpected error getting worker PIN status:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    }
  }
}
