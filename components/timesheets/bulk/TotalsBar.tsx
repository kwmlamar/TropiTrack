"use client";

import { useTheme } from "next-themes";
import { Calculator } from "lucide-react";
import type { TimesheetTotals } from "@/lib/timesheets/calc";

interface TotalsBarProps {
  totals: TimesheetTotals;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  entriesCount?: number;
  datesCount?: number;
}

/**
 * Summary bar showing bulk timesheet totals
 * Displays workers, days, total entries, hours, and cost
 */
export function TotalsBar({ totals }: TotalsBarProps) {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 shadow-lg"
      style={{
        backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
        backdropFilter: 'blur(12px)',
        borderTop: theme === 'dark' 
          ? '1px solid rgba(37, 150, 190, 0.15)' 
          : '1px solid rgba(37, 150, 190, 0.1)',
        boxShadow: theme === 'dark'
          ? '0 -4px 6px -1px rgba(0, 0, 0, 0.3), 0 -2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="flex items-center gap-2">
        <Calculator
          className="h-5 w-5"
          style={{ color: '#2596be' }}
        />
        <span
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
        >
          Summary
        </span>
      </div>
      
      <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          >
            Workers:
          </span>
          <span
            className="text-base font-bold"
            style={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
          >
            {totals.workers}
          </span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          >
            Days:
          </span>
          <span
            className="text-base font-bold"
            style={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
          >
            {totals.days}
          </span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          >
            Entries:
          </span>
          <span
            className="text-base font-bold"
            style={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
          >
            {totals.workers * totals.days}
          </span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          >
            Hours:
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: '#2596be' }}
          >
            {totals.hours}h
          </span>
        </div>
        
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
          >
            Cost:
          </span>
          <span
            className="text-lg font-extrabold"
            style={{ color: '#2596be' }}
          >
            ${totals.cost}
          </span>
        </div>
      </div>
    </div>
  );
}



