"use client";

import { useTheme } from "next-themes";
import { Calculator, Save, Loader2, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
 * Displays workers, days, total entries, hours, cost, and submit button
 */
export function TotalsBar({ totals, isSubmitting = false, onSubmit, entriesCount = 0, datesCount = 0 }: TotalsBarProps) {
  const { theme } = useTheme();
  const totalTimesheets = entriesCount * datesCount;

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
      
      {/* Submit Button */}
      {onSubmit && totalTimesheets > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button 
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || entriesCount === 0}
            className="relative overflow-hidden h-11 px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
            aria-label={`Create ${totalTimesheets} timesheet entries`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create {totalTimesheets} {totalTimesheets === 1 ? 'Timesheet' : 'Timesheets'}
              </>
            )}
          </Button>
          
          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>or press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">S</kbd>
          </div>
        </div>
      )}
    </div>
  );
}



