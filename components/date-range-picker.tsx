"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings";
import { useDateRange } from "@/context/date-range-context";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const { paymentSchedule } = usePayrollSettings()
  const { dateRange: contextDateRange, setDateRange: setContextDateRange } = useDateRange()
  
  // Get week start day from payment schedule, default to Saturday for construction industry
  const getWeekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    if (paymentSchedule?.period_start_type === "day_of_week") {
      const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
      }
      return dayMap[paymentSchedule.period_start_day] || 6
    }
    return 6 // Default to Saturday for construction industry
  }

  // Use context date range if no props provided, otherwise use props
  const currentDateRange = dateRange || contextDateRange
  const setCurrentDateRange = onDateRangeChange || setContextDateRange

  const handleDateChange = (newDate: DateRange | undefined) => {
    setCurrentDateRange(newDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !currentDateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDateRange?.from ? (
              currentDateRange.to ? (
                <>
                  {format(currentDateRange.from, "LLL dd, y")} -{" "}
                  {format(currentDateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(currentDateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={currentDateRange?.from}
            selected={currentDateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
            weekStartsOn={getWeekStartsOn()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 