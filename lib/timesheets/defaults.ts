/**
 * Default values for bulk timesheet entries
 */

export const DEFAULT_WORK_DAY_START = "07:00";
export const DEFAULT_WORK_DAY_END = "16:00";
export const DEFAULT_BREAK_DURATION = 60; // minutes

/**
 * Get default timesheet entry values with optional overrides from settings
 */
export function getDefaultTimesheetValues(settings?: {
  work_day_start?: string;
  work_day_end?: string;
  break_time?: number;
}) {
  return {
    clock_in: settings?.work_day_start || DEFAULT_WORK_DAY_START,
    clock_out: settings?.work_day_end || DEFAULT_WORK_DAY_END,
    break_duration: settings?.break_time || DEFAULT_BREAK_DURATION,
  };
}

