"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, differenceInDays, subDays, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type PayPeriodType = "weekly" | "bi-weekly" | "monthly" | "custom"

interface PayrollFiltersProps {
  date: DateRange | undefined
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  setPayPeriodType: React.Dispatch<React.SetStateAction<string>>
  payPeriodType: string
  paymentSchedule: PaymentSchedule | null
}

export function PayrollFilters({
  date,
  setDate,
  setPayPeriodType,
  paymentSchedule,
}: PayrollFiltersProps) {
  const [payPeriod, setPayPeriod] = useState<PayPeriodType>(
    (paymentSchedule?.pay_period_type || "bi-weekly") as PayPeriodType
  )

  const getWeekStartsOn = (day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
    }
    return dayMap[day] || 1
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
      case "custom":
        newDateRange = date // Keep existing custom date if any
        break
      default: {
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = { from: periodStart, to: addDays(periodStart, 13) }
      }
    }

    if (payPeriod !== 'custom') {
        setDate(newDateRange)
    }
    setPayPeriodType(payPeriod)
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPeriod, paymentSchedule])

  const navigatePeriod = (direction: 'previous' | 'next') => {
    if (!date?.from) return

    let newFrom: Date
    let newTo: Date

    const to = date.to || date.from;

    switch (payPeriod) {
      case "weekly":
      case "bi-weekly": {
        const days = payPeriod === "weekly" ? 7 : 14
        const multiplier = direction === "previous" ? -1 : 1
        newFrom = addDays(date.from, days * multiplier)
        newFrom = getCurrentPeriodStart(newFrom)
        newTo = addDays(newFrom, days - 1)
        break
      }
      case "monthly": {
        const monthOffset = direction === "previous" ? -1 : 1
        newFrom = startOfMonth(addMonths(date.from, monthOffset))
        newTo = endOfMonth(newFrom)
        break
      }
      default: {
        const periodLength = differenceInDays(to, date.from)
        const multiplier = direction === "previous" ? -1 : 1
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
              initialFocus
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
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </Button>
      </div>
    </div>
  )
}

