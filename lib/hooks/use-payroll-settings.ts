"use client"

import { useEffect, useState, useCallback } from "react"
import { getPaymentSchedule } from "@/lib/data/payroll-settings"
import { getPayrollSettings } from "@/lib/data/payroll-settings"
import { getDeductionRules } from "@/lib/data/payroll-settings"
import type { PaymentSchedule, PayrollSettings, DeductionRule } from "@/lib/types/payroll-settings"
import { toast } from "sonner"
import type { ApiResponse } from "@/lib/types"

// Cache for settings to avoid redundant API calls
let settingsCache: {
  paymentSchedule: PaymentSchedule | null
  payrollSettings: PayrollSettings | null
  deductionRules: DeductionRule[]
  lastUpdated: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function usePayrollSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null)
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null)
  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([])

  const loadSettings = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && settingsCache && (Date.now() - settingsCache.lastUpdated) < CACHE_DURATION) {
      setPaymentSchedule(settingsCache.paymentSchedule)
      setPayrollSettings(settingsCache.payrollSettings)
      setDeductionRules(settingsCache.deductionRules)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Load all settings in parallel with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      )
      
      const settingsPromise = Promise.all([
        getPaymentSchedule(),
        getPayrollSettings(),
        getDeductionRules(),
      ])

      const [scheduleResult, settingsResult, deductionsResult] = await Promise.race([
        settingsPromise,
        timeoutPromise
      ]) as [ApiResponse<PaymentSchedule>, ApiResponse<PayrollSettings>, ApiResponse<DeductionRule[]>]

      const newPaymentSchedule = scheduleResult.success ? scheduleResult.data : null
      const newPayrollSettings = settingsResult.success ? settingsResult.data : null
      const newDeductionRules = deductionsResult.success && deductionsResult.data ? deductionsResult.data.filter((rule: DeductionRule) => rule.is_active) : []

      // Update state
      setPaymentSchedule(newPaymentSchedule)
      setPayrollSettings(newPayrollSettings)
      setDeductionRules(newDeductionRules)

      // Update cache
      settingsCache = {
        paymentSchedule: newPaymentSchedule,
        payrollSettings: newPayrollSettings,
        deductionRules: newDeductionRules,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error("Error loading payroll settings:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to load payroll settings"
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your internet connection."
        } else if (error.message.includes("Load failed")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("User not found")) {
          errorMessage = "Authentication error. Please log in again."
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Set default values to prevent app crashes
      setPaymentSchedule(null)
      setPayrollSettings(null)
      setDeductionRules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const calculateDeductions = useCallback((grossPay: number, overtimePay: number = 0) => {
    if (!payrollSettings) return { nibDeduction: 0, otherDeductions: 0 }

    // Calculate NIB deduction with hardcoded 4.65% rate
    const EMPLOYEE_NIB_RATE = 0.0465 // 4.65%
    const nibDeduction = grossPay * EMPLOYEE_NIB_RATE

    // Calculate other deductions based on active rules
    const otherDeductions = deductionRules.reduce((total, rule) => {
      const baseAmount = rule.applies_to_overtime ? grossPay + overtimePay : grossPay
      const deduction = rule.type === "percentage" 
        ? baseAmount * (rule.value / 100)
        : rule.value
      return total + deduction
    }, 0)

    return {
      nibDeduction,
      otherDeductions,
    }
  }, [payrollSettings, deductionRules])

  const getDefaultPayPeriod = useCallback(() => {
    if (!paymentSchedule) return "bi-weekly"
    return paymentSchedule.pay_period_type
  }, [paymentSchedule])

  const refresh = useCallback(() => {
    loadSettings(true) // Force refresh
  }, [loadSettings])

  return {
    loading,
    error,
    paymentSchedule,
    payrollSettings,
    deductionRules,
    calculateDeductions,
    getDefaultPayPeriod,
    refresh,
  }
} 