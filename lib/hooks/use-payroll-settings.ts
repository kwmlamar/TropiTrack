import { useEffect, useState, useCallback } from "react"
import { getPaymentSchedule } from "@/lib/data/payroll-settings"
import { getPayrollSettings } from "@/lib/data/payroll-settings"
import { getDeductionRules } from "@/lib/data/payroll-settings"
import type { PaymentSchedule, PayrollSettings, DeductionRule } from "@/lib/types/payroll-settings"
import { toast } from "sonner"

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
      return
    }

    setLoading(true)
    try {
      // Load all settings in parallel
      const [scheduleResult, settingsResult, deductionsResult] = await Promise.all([
        getPaymentSchedule(),
        getPayrollSettings(),
        getDeductionRules(),
      ])

      const newPaymentSchedule = scheduleResult.success ? scheduleResult.data : null
      const newPayrollSettings = settingsResult.success ? settingsResult.data : null
      const newDeductionRules = deductionsResult.success && deductionsResult.data ? deductionsResult.data.filter(rule => rule.is_active) : []

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
      toast.error("Failed to load payroll settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const calculateDeductions = useCallback((grossPay: number, overtimePay: number = 0) => {
    if (!payrollSettings) return { nibDeduction: 0, otherDeductions: 0 }

    // Calculate NIB deduction
    const nibRate = payrollSettings.nib_rate / 100
    const nibDeduction = grossPay * nibRate

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
    paymentSchedule,
    payrollSettings,
    deductionRules,
    calculateDeductions,
    getDefaultPayPeriod,
    refresh,
  }
} 