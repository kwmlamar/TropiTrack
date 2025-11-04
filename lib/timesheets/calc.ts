/**
 * Calculation utilities for bulk timesheets
 */

export interface TimesheetEntry {
  worker_id: string;
  clock_in: string;
  clock_out: string;
  break_duration: number;
  hourly_rate: number;
  task_description?: string;
  notes?: string;
}

export interface TimesheetTotals {
  hours: string;
  cost: string;
  days: number;
  workers: number;
}

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate work hours for a single entry
 * Handles overnight shifts and break duration
 */
export function calculateEntryHours(
  clockIn: string,
  clockOut: string,
  breakMinutes: number
): number {
  const clockInMinutes = parseTimeToMinutes(clockIn);
  const clockOutMinutes = parseTimeToMinutes(clockOut);

  // Calculate difference in minutes, handling overnight shifts
  let diffMinutes = clockOutMinutes - clockInMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Add 24 hours in minutes
  }

  // Subtract break duration
  const workMinutes = Math.max(0, diffMinutes - breakMinutes);
  return workMinutes / 60; // Convert to hours
}

/**
 * Calculate totals for all timesheet entries
 * Each worker works for each selected day
 */
export function calculateBulkTimesheetTotals(
  entries: TimesheetEntry[],
  numberOfDays: number
): TimesheetTotals {
  let totalHours = 0;
  let totalCost = 0;

  entries.forEach((entry) => {
    if (entry && entry.clock_in && entry.clock_out && entry.worker_id) {
      const hours = calculateEntryHours(
        entry.clock_in,
        entry.clock_out,
        entry.break_duration || 0
      );
      const hourlyRate = Number(entry.hourly_rate) || 0;

      // Each worker works for each selected day
      totalHours += hours * numberOfDays;
      totalCost += hours * numberOfDays * hourlyRate;
    }
  });

  return {
    hours: isNaN(totalHours) ? "0.00" : totalHours.toFixed(2),
    cost: isNaN(totalCost) ? "0.00" : totalCost.toFixed(2),
    days: numberOfDays,
    workers: entries.length,
  };
}

