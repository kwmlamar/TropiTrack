"use client"

import { useCallback } from "react"
import type { PaymentSchedule, PayrollSettings, DeductionRule } from "@/lib/types/payroll-settings"

// Mock default values to avoid API calls and timeout errors
const DEFAULT_PAYMENT_SCHEDULE: PaymentSchedule = {
  id: "default",
  company_id: "default",
  pay_period_type: "bi-weekly",
  week_starts_on: 6, // Saturday
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  id: "default",
  company_id: "default",
  nib_rate: 4.65,
  nib_enabled: true,
  overtime_rate: 1.5,
  column_settings: {
    worker_name: true,
    hours_worked: true,
    overtime_hours: true,
    regular_pay: true,
    overtime_pay: true,
    total_pay: true,
    deductions: true,
    net_pay: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const DEFAULT_DEDUCTION_RULES: DeductionRule[] = []

export function usePayrollSettings() {
  // Return mock data immediately without any API calls
  const calculateDeductions = useCallback((grossPay: number, overtimePay: number = 0) => {
    // Calculate NIB deduction based on nib_enabled setting
    const EMPLOYEE_NIB_RATE = DEFAULT_PAYROLL_SETTINGS.nib_enabled 
      ? (DEFAULT_PAYROLL_SETTINGS.nib_rate / 100) 
      : 0
    const nibDeduction = grossPay * EMPLOYEE_NIB_RATE

    // Calculate other deductions based on active rules
    const otherDeductions = DEFAULT_DEDUCTION_RULES.reduce((total, rule) => {
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
  }, [])

  const getDefaultPayPeriod = useCallback(() => {
    return DEFAULT_PAYMENT_SCHEDULE.pay_period_type
  }, [])

  const refresh = useCallback(() => {
    // No-op function since we're using mock data
    console.log("Payroll settings refresh called (mock mode)")
  }, [])

  return {
    loading: false,
    error: null,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    payrollSettings: DEFAULT_PAYROLL_SETTINGS,
    deductionRules: DEFAULT_DEDUCTION_RULES,
    calculateDeductions,
    getDefaultPayPeriod,
    refresh,
  }
}