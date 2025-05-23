// lib/data/transformers.ts

import { Timesheet } from "@/components/timesheets/timesheets-columns";
import { WeeklyTimesheetRow } from "@/lib/types";
import { format } from "date-fns";

export function groupToWeeklyRows(entries: Timesheet[]): WeeklyTimesheetRow[] {
  const map = new Map<string, WeeklyTimesheetRow>();

  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  type DayKey = (typeof dayKeys)[number]; // "mon" | "tue" | ...

  for (const entry of entries) {
    const day = format(new Date(entry.date), "eee").toLowerCase(); // "mon", etc.
  
    if (!dayKeys.includes(day as DayKey)) continue;
  
    const key = entry.worker_id;
  
    if (!map.has(key)) {
      map.set(key, { worker_id: key });
    }
  
    const row = map.get(key)!;
    const dayKey = day as DayKey;
  
    row[dayKey] = (row[dayKey] || 0) + entry.total_hours;
  }
  

  return Array.from(map.values());
}
