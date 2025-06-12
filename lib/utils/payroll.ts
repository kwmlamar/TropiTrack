import { addDays, addMonths, endOfMonth, isValid, setDate } from "date-fns"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"

export function getNextPayDates(schedule: PaymentSchedule, count = 3): Date[] {
  const today = new Date()
  const dates: Date[] = []

  let currentDate = today
  while (dates.length < count) {
    const nextDate = getNextPayDate(currentDate, schedule)
    if (nextDate) {
      dates.push(nextDate)
      currentDate = nextDate
    } else {
      break
    }
  }

  return dates
}

export function getNextPayDate(fromDate: Date, schedule: PaymentSchedule): Date | null {
  if (!isValid(fromDate)) return null

  const { pay_period_type, pay_day, pay_day_type } = schedule

  let nextDate: Date | null = null

  if (pay_day_type === "day_of_month") {
    // For monthly payments, find the next valid pay day
    let targetDate = setDate(fromDate, pay_day)
    
    // If we're past the pay day this month, move to next month
    if (targetDate <= fromDate) {
      targetDate = setDate(addMonths(fromDate, 1), pay_day)
    }

    // Adjust for months that don't have the specified day
    const endOfTargetMonth = endOfMonth(targetDate)
    nextDate = targetDate > endOfTargetMonth ? endOfTargetMonth : targetDate
  } else {
    // For day of week payments (1 = Monday, 7 = Sunday)
    const currentDayOfWeek = fromDate.getDay() || 7 // Convert Sunday from 0 to 7
    let daysToAdd = pay_day - currentDayOfWeek

    if (daysToAdd <= 0) {
      // If we're past the pay day this week, move to next occurrence
      daysToAdd += pay_period_type === "weekly" ? 7 : 14
    }

    nextDate = addDays(fromDate, daysToAdd)
  }

  return nextDate
}

export function validatePayDay(
  payDay: number,
  payDayType: "day_of_month" | "day_of_week",
): string | null {
  if (payDayType === "day_of_month") {
    if (payDay < 1 || payDay > 31) {
      return "Day of month must be between 1 and 31"
    }
    if (payDay > 28) {
      return "Warning: Some months don't have this day. Payment will be made on the last day of those months."
    }
  } else {
    if (payDay < 1 || payDay > 7) {
      return "Day of week must be between 1 (Monday) and 7 (Sunday)"
    }
  }

  return null
}

export function validatePeriodStartDay(
  startDay: number,
  startDayType: "day_of_month" | "day_of_week",
  payDay: number,
  payDayType: "day_of_month" | "day_of_week",
  payPeriodType: "weekly" | "bi-weekly" | "monthly" | "custom"
): string | null {
  if (startDayType === "day_of_month") {
    if (startDay < 1 || startDay > 31) {
      return "Day of month must be between 1 and 31"
    }
    if (startDay > 28) {
      return "Warning: Some months don't have this day. Period will start on the last day of those months."
    }

    if (payDayType === "day_of_month" && payPeriodType === "monthly") {
      if (startDay >= payDay) {
        return "Period start day should be before the pay day"
      }
    }
  } else {
    if (startDay < 1 || startDay > 7) {
      return "Day of week must be between 1 (Monday) and 7 (Sunday)"
    }

    if (payDayType === "day_of_week") {
      if (payPeriodType === "weekly" && startDay === payDay) {
        return "For weekly pay periods, start day should be different from pay day"
      }
      if (payPeriodType === "bi-weekly" && startDay === payDay) {
        return "For bi-weekly pay periods, start day should be different from pay day"
      }
    }
  }

  return null
}

export function formatPayDay(day: number, type: "day_of_month" | "day_of_week"): string {
  if (type === "day_of_month") {
    return `${day}${getDayOfMonthSuffix(day)}`
  } else {
    return getDayOfWeekName(day)
  }
}

function getDayOfMonthSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

function getDayOfWeekName(day: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  return days[day - 1] || ""
} 