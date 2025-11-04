/**
 * Payroll and approval rules for timesheets
 */

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Convert day number (1-7) to week start day (0-6)
 * 1 = Monday, 7 = Sunday (0)
 */
export function getWeekStartsOn(day: number): WeekStartDay {
  const dayMap: Record<number, WeekStartDay> = {
    1: 1, // Monday
    2: 2, // Tuesday
    3: 3, // Wednesday
    4: 4, // Thursday
    5: 5, // Friday
    6: 6, // Saturday
    7: 0, // Sunday
  };
  return dayMap[day] || 1; // Default to Monday
}

/**
 * Get the period start day based on payroll settings
 * Defaults to Saturday (6) for construction industry in Bahamas
 */
export function getPeriodStartDay(
  paymentSchedule?: {
    period_start_type?: string;
    period_start_day?: number;
  }
): WeekStartDay {
  if (paymentSchedule?.period_start_type === "day_of_week" && paymentSchedule.period_start_day) {
    return getWeekStartsOn(paymentSchedule.period_start_day);
  }
  return 6; // Default to Saturday
}

