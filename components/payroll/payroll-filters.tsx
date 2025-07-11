"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, differenceInDays, subDays, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Table } from "@tanstack/react-table"
import type { PayrollRecord } from "@/lib/types"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { updatePayrollSettings } from "@/lib/data/payroll-settings"

type PayPeriodType = "weekly" | "bi-weekly" | "monthly" | "custom"

interface PayrollFiltersProps {
  date: DateRange | undefined
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  setPayPeriodType: React.Dispatch<React.SetStateAction<string>>
  payPeriodType: string
  paymentSchedule: PaymentSchedule | null
  table?: Table<PayrollRecord>
}

export function PayrollFilters({
  date,
  setDate,
  setPayPeriodType,
  paymentSchedule,
  table,
}: PayrollFiltersProps) {
  const { payrollSettings, refresh: refreshSettings } = usePayrollSettings()
  const [payPeriod, setPayPeriod] = useState<PayPeriodType>(
    (paymentSchedule?.pay_period_type || "bi-weekly") as PayPeriodType
  )

  const getWeekStartsOn = (day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
    }
    return dayMap[day] || 6 // Default to Saturday for construction industry
  }

  const getCurrentPeriodStart = (d: Date): Date => {
    const periodStartDay = paymentSchedule?.period_start_day
      ? getWeekStartsOn(paymentSchedule.period_start_day)
      : 1
    const currentDay = d.getDay()
    const daysToSubtract = (currentDay - periodStartDay + 7) % 7
    return subDays(d, daysToSubtract)
  }

  useEffect(() => {
    if (paymentSchedule) {
      setPayPeriod(paymentSchedule.pay_period_type as PayPeriodType)
    }
  }, [paymentSchedule])

  useEffect(() => {
    const today = new Date()
    let newDateRange: DateRange | undefined

    if (payPeriod === 'custom') {
      // For custom, we don't auto-set the date. It's set by the calendar.
      return
    }

    switch (payPeriod) {
      case "weekly":
      case "bi-weekly": {
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = {
          from: periodStart,
          to: addDays(periodStart, payPeriod === "weekly" ? 6 : 13),
        }
        break
      }
      case "monthly":
        newDateRange = { from: startOfMonth(today), to: endOfMonth(today) }
        break
      default: {
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = { from: periodStart, to: addDays(periodStart, 13) }
      }
    }

    setDate(newDateRange)
    setPayPeriodType(payPeriod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPeriod])

  // Update column visibility when settings change
  useEffect(() => {
    if (table && payrollSettings?.column_settings) {
      Object.entries(payrollSettings.column_settings).forEach(([columnId, isVisible]) => {
        const column = table.getColumn(columnId)
        if (column) {
          column.toggleVisibility(isVisible)
        }
      })
    }
  }, [table, payrollSettings])

  // Save column visibility to database
  const saveColumnVisibility = async (columnId: string, isVisible: boolean) => {
    if (!table || !payrollSettings?.id) return;

    const updatedSettings = {
      ...payrollSettings.column_settings,
      [columnId]: isVisible,
    };

    try {
      await updatePayrollSettings({
        id: payrollSettings.id,
        column_settings: updatedSettings,
      });
      await refreshSettings();
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  };

  const navigatePeriod = (direction: 'previous' | 'next') => {
    if (!date?.from) return

    const multiplier = direction === 'previous' ? -1 : 1
    let newFrom: Date
    let newTo: Date

    switch (payPeriod) {
      case "weekly": {
        newFrom = addDays(date.from, 7 * multiplier)
        newTo = addDays(newFrom, 6)
        break
      }
      case "bi-weekly": {
        newFrom = addDays(date.from, 14 * multiplier)
        newTo = addDays(newFrom, 13)
        break
      }
      case "monthly": {
        const newMonth = addMonths(date.from, multiplier)
        newFrom = startOfMonth(newMonth)
        newTo = endOfMonth(newMonth)
        break
      }
      default: { // Handles "custom" or other cases
        const to = date.to || date.from;
        const periodLength = differenceInDays(to, date.from)
        newFrom = addDays(date.from, (periodLength + 1) * multiplier)
        newTo = addDays(to, (periodLength + 1) * multiplier)
      }
    }

    setDate({ from: newFrom, to: newTo })
  }

  const handlePayPeriodChange = (value: PayPeriodType | "") => {
    if (value) {
      setPayPeriod(value as PayPeriodType)
    }
  }

  const columnLabels: Record<string, string> = {
    worker_id: "Worker",
    gross_pay: "Gross Pay",
    nib_deduction: "NIB Deduction",
    other_deductions: "Other Deductions",
    total_deductions: "Total Deductions",
    net_pay: "Net Pay",
    status: "Status",
    total_hours: "Hours",
    overtime_hours: "Overtime Hours",
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={payPeriod}
          onValueChange={handlePayPeriodChange}
          aria-label="Pay Period"
          className="bg-muted p-1 rounded-lg"
        >
          <ToggleGroupItem value="weekly" aria-label="Weekly" className="text-xs px-3 h-8">
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="bi-weekly" aria-label="Bi-weekly" className="text-xs px-3 h-8">
            Bi-weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Monthly" className="text-xs px-3 h-8">
            Monthly
          </ToggleGroupItem>
        </ToggleGroup>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{payPeriod === "custom" ? "Custom Range" : "Calendar"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                setDate(range)
                setPayPeriod("custom")
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigatePeriod("previous")}
          disabled={!date?.from}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Period</span>
        </Button>

        <div className="text-sm font-medium text-center min-w-[220px]">
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM d")} - {format(date.to, "MMM d, yyyy")}
              </>
            ) : (
              format(date.from, "MMM d, yyyy")
            )
          ) : (
            <span>Select a date range</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigatePeriod("next")}
          disabled={!date?.from}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Period</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {table && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Settings2 className="h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value)
                        saveColumnVisibility(column.id, !!value)
                      }}
                    >
                      {columnLabels[column.id] || column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </Button>
      </div>
    </div>
  )
}

