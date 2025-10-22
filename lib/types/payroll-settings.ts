export type PayPeriodType = "weekly" | "bi-weekly" | "monthly" | "custom"

export type PaymentSchedule = {
  id: string
  company_id: string
  pay_period_type: "weekly" | "bi-weekly" | "monthly" | "custom"
  pay_day: number // 1-31 for monthly, 1-7 for weekly/bi-weekly (representing days of week)
  pay_day_type: "day_of_month" | "day_of_week"
  period_start_day: number // 1-31 for monthly, 1-7 for weekly/bi-weekly
  period_start_type: "day_of_month" | "day_of_week"
  created_at: string
  updated_at: string
}

export type PayrollSettings = {
  id: string
  company_id: string
  nib_rate: number
  nib_enabled: boolean
  overtime_rate: number
  column_settings: Record<string, boolean>
  created_at: string
  updated_at: string
}

export type DeductionRule = {
  id: string
  company_id: string
  name: string
  description?: string
  type: "percentage" | "fixed"
  value: number // percentage or fixed amount
  is_active: boolean
  applies_to_overtime: boolean
  created_at: string
  updated_at: string
}

export type CreatePayrollSettingsInput = Omit<
  PayrollSettings,
  "id" | "created_at" | "updated_at"
>

export type UpdatePayrollSettingsInput = Partial<CreatePayrollSettingsInput> & {
  id: string
}

export type CreatePaymentScheduleInput = Omit<
  PaymentSchedule,
  "id" | "created_at" | "updated_at"
>

export type UpdatePaymentScheduleInput = Partial<CreatePaymentScheduleInput> & {
  id: string
}

export type CreateDeductionRuleInput = Omit<DeductionRule, "id" | "created_at" | "updated_at">

export type UpdateDeductionRuleInput = Partial<Omit<DeductionRule, "id" | "created_at" | "updated_at">> & {
  id: string
} 