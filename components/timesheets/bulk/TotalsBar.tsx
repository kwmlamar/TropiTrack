"use client";

import { useTheme } from "next-themes";
import { Calculator } from "lucide-react";
import type { TimesheetTotals } from "@/lib/timesheets/calc";

interface TotalsBarProps {
  totals: TimesheetTotals;
}

/**
 * Summary bar showing bulk timesheet totals
 * Displays workers, days, total entries, hours, and cost
 */
export function TotalsBar({ totals }: TotalsBarProps) {
  const { theme } = useTheme();

  return (
    <div
      className="summary-fixed-bottom flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4"
      style={{
        backgroundColor: theme === 'dark' ? '#0f0f0f' : 'rgb(243 244 246 / 0.98)',
        backdropFilter: 'blur(8px)',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
      }}
    >
      <div className="flex items-center gap-2">
        <Calculator
          className="h-5 w-5"
          style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
        >
          Summary:
        </span>
      </div>
      
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <span
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Workers:
          </span>{" "}
          <span
            className="font-medium"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            {totals.workers}
          </span>
        </div>
        
        <div>
          <span
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Days:
          </span>{" "}
          <span
            className="font-medium"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            {totals.days}
          </span>
        </div>
        
        <div>
          <span
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Total Entries:
          </span>{" "}
          <span
            className="font-medium"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            {totals.workers * totals.days}
          </span>
        </div>
        
        <div>
          <span
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Total Hours:
          </span>{" "}
          <span
            className="font-medium"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            {totals.hours}h
          </span>
        </div>
        
        <div>
          <span
            className="text-sm"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Total Cost:
          </span>{" "}
          <span
            className="font-medium"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
          >
            ${totals.cost}
          </span>
        </div>
      </div>
    </div>
  );
}

