import { supabase } from "@/lib/supabaseClient"
import type { ApiResponse } from "@/lib/types"
import type {
  PayrollSettings,
  CreatePayrollSettingsInput,
  UpdatePayrollSettingsInput,
  PaymentSchedule,
  CreatePaymentScheduleInput,
  UpdatePaymentScheduleInput,
  DeductionRule,
  CreateDeductionRuleInput,
  UpdateDeductionRuleInput,
} from "@/lib/types/payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

// Payroll Settings
export async function getPayrollSettings(): Promise<ApiResponse<PayrollSettings>> {
  try {
    const profile = await getUserProfileWithCompany()
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false }
    }

    const { data, error } = await supabase
      .from("payroll_settings")
      .select("*")
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      console.error("Supabase error fetching payroll settings:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PayrollSettings, error: null, success: true }
  } catch (error) {
    console.error("Error fetching payroll settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    
    // Provide more specific error messages
    if (errorMessage.includes("User not found")) {
      return { data: null, error: "Authentication error. Please log in again.", success: false }
    } else if (errorMessage.includes("Load failed")) {
      return { data: null, error: "Network error. Please check your connection.", success: false }
    }
    
    return {
      data: null,
      error: errorMessage,
      success: false,
    }
  }
}

export async function createPayrollSettings(
  input: CreatePayrollSettingsInput
): Promise<ApiResponse<PayrollSettings>> {
  try {
    const { data, error } = await supabase
      .from("payroll_settings")
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PayrollSettings, error: null, success: true }
  } catch (error) {
    console.error("Error creating payroll settings:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function updatePayrollSettings(
  input: UpdatePayrollSettingsInput
): Promise<ApiResponse<PayrollSettings>> {
  try {
    const { id, ...updates } = input
    const { data, error } = await supabase
      .from("payroll_settings")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PayrollSettings, error: null, success: true }
  } catch (error) {
    console.error("Error updating payroll settings:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

// Payment Schedule
export async function getPaymentSchedule(): Promise<ApiResponse<PaymentSchedule>> {
  try {
    const profile = await getUserProfileWithCompany()
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false }
    }

    const { data, error } = await supabase
      .from("payment_schedules")
      .select("*")
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PaymentSchedule, error: null, success: true }
  } catch (error) {
    console.error("Error fetching payment schedule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function createPaymentSchedule(
  input: CreatePaymentScheduleInput
): Promise<ApiResponse<PaymentSchedule>> {
  try {
    const { data, error } = await supabase
      .from("payment_schedules")
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PaymentSchedule, error: null, success: true }
  } catch (error) {
    console.error("Error creating payment schedule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function updatePaymentSchedule(
  input: UpdatePaymentScheduleInput
): Promise<ApiResponse<PaymentSchedule>> {
  try {
    const { id, ...updates } = input
    const { data, error } = await supabase
      .from("payment_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as PaymentSchedule, error: null, success: true }
  } catch (error) {
    console.error("Error updating payment schedule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

// Deduction Rules
export async function getDeductionRules(): Promise<ApiResponse<DeductionRule[]>> {
  try {
    const profile = await getUserProfileWithCompany()
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false }
    }

    const { data, error } = await supabase
      .from("deduction_rules")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: true })

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as DeductionRule[], error: null, success: true }
  } catch (error) {
    console.error("Error fetching deduction rules:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function createDeductionRule(
  input: CreateDeductionRuleInput
): Promise<ApiResponse<DeductionRule>> {
  try {
    const { data, error } = await supabase
      .from("deduction_rules")
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as DeductionRule, error: null, success: true }
  } catch (error) {
    console.error("Error creating deduction rule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function updateDeductionRule(
  input: UpdateDeductionRuleInput
): Promise<ApiResponse<DeductionRule>> {
  try {
    const { id, ...updates } = input
    const { data, error } = await supabase
      .from("deduction_rules")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: data as DeductionRule, error: null, success: true }
  } catch (error) {
    console.error("Error updating deduction rule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function deleteDeductionRule(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("deduction_rules").delete().eq("id", id)

    if (error) {
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Error deleting deduction rule:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
} 