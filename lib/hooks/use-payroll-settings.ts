import { useEffect, useState } from "react"
import { getPaymentSchedule } from "@/lib/data/payroll-settings"
import { getPayrollSettings } from "@/lib/data/payroll-settings"
import { getDeductionRules } from "@/lib/data/payroll-settings"
import type { PaymentSchedule, PayrollSettings, DeductionRule } from "@/lib/types/payroll-settings"
import { toast } from "sonner"

export function usePayrollSettings() {
  const [loading, setLoading] = useState(true)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null)
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null)
  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Load all settings in parallel
      const [scheduleResult, settingsResult, deductionsResult] = await Promise.all([
        getPaymentSchedule(),
        getPayrollSettings(),
        getDeductionRules(),
      ])

      if (scheduleResult.success && scheduleResult.data) {
        setPaymentSchedule(scheduleResult.data)
      }

      if (settingsResult.success && settingsResult.data) {
        setPayrollSettings(settingsResult.data)
      }

      if (deductionsResult.success && deductionsResult.data) {
        setDeductionRules(deductionsResult.data.filter(rule => rule.is_active))
      }
    } catch (error) {
      console.error("Error loading payroll settings:", error)
      toast.error("Failed to load payroll settings")
    } finally {
      setLoading(false)
    }
  }

  const calculateDeductions = (grossPay: number, overtimePay: number = 0) => {
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
  }

  const getDefaultPayPeriod = () => {
    if (!paymentSchedule) return "bi-weekly"
    return paymentSchedule.pay_period_type
  }

  return {
    loading,
    paymentSchedule,
    payrollSettings,
    deductionRules,
    calculateDeductions,
    getDefaultPayPeriod,
    refresh: loadSettings,
  }
} 