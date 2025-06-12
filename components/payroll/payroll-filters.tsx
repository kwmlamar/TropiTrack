"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, differenceInDays, subDays, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Worker } from "@/lib/types/worker"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"

type PayPeriodType = "weekly" | "bi-weekly" | "monthly" | "custom"

interface PayrollFiltersProps {
  workers: Worker[]
  date: DateRange | undefined
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  setPayPeriodType: React.Dispatch<React.SetStateAction<string>>
  payPeriodType: string
  paymentSchedule: PaymentSchedule | null
}

export function PayrollFilters({ workers, date, setDate, setPayPeriodType, paymentSchedule }: PayrollFiltersProps) {
  const [payPeriod, setPayPeriod] = useState<PayPeriodType>(
    (paymentSchedule?.pay_period_type || "bi-weekly") as PayPeriodType
  )
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")

  // Convert period start day to 0-6 range for date-fns (0 = Sunday)
  const getWeekStartsOn = (day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    // If day is in 1-7 range (Monday = 1, Sunday = 7), convert to 0-6 range (Sunday = 0)
    const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
      1: 1, // Monday
      2: 2, // Tuesday
      3: 3, // Wednesday
      4: 4, // Thursday
      5: 5, // Friday
      6: 6, // Saturday
      7: 0, // Sunday
    }
    return dayMap[day] || 1 // Default to Monday if invalid
  }

  // Helper function to get the start of the period based on period_start_day
  const getCurrentPeriodStart = (date: Date): Date => {
    const periodStartDay = paymentSchedule?.period_start_day
      ? getWeekStartsOn(paymentSchedule.period_start_day)
      : 1
    const currentDay = date.getDay()
    const daysToSubtract = (currentDay - periodStartDay + 7) % 7
    return subDays(date, daysToSubtract)
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
      case "weekly": {
        // Get the start of the current period based on period_start_day
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = {
          from: periodStart,
          to: addDays(periodStart, 6), // Add 6 days to get a full week
        }
        break
      }
      case "bi-weekly": {
        // Get the start of the current period based on period_start_day
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = {
          from: periodStart,
          to: addDays(periodStart, 13), // Add 13 days to get two full weeks
        }
        break
      }
      case "monthly":
        newDateRange = {
          from: startOfMonth(today),
          to: endOfMonth(today),
        }
        break
      case "custom":
        newDateRange = undefined
        break
      default:
        // Default to bi-weekly if no period type is selected
        const periodStart = getCurrentPeriodStart(today)
        newDateRange = {
          from: periodStart,
          to: addDays(periodStart, 13),
        }
        break
    }

    if (payPeriod !== "custom" || (payPeriod === "custom" && !date?.from && !date?.to)) {
      setDate(newDateRange)
    }

    setPayPeriodType(payPeriod)
  }, [payPeriod, setDate, setPayPeriodType, paymentSchedule])

  const navigatePeriod = (direction: 'previous' | 'next') => {
    if (!date?.from || !date?.to) return

    let newFrom: Date
    let newTo: Date

    switch (payPeriod) {
      case "weekly": {
        if (direction === 'previous') {
          newFrom = subDays(date.from, 7)
          newTo = subDays(date.to, 7)
        } else {
          newFrom = addDays(date.from, 7)
          newTo = addDays(date.to, 7)
        }
        // Ensure we're aligned with the period start day
        newFrom = getCurrentPeriodStart(newFrom)
        newTo = addDays(newFrom, 6)
        break
      }
      case "bi-weekly": {
        if (direction === 'previous') {
          newFrom = subDays(date.from, 14)
          newTo = subDays(date.to, 14)
        } else {
          newFrom = addDays(date.from, 14)
          newTo = addDays(date.to, 14)
        }
        // Ensure we're aligned with the period start day
        newFrom = getCurrentPeriodStart(newFrom)
        newTo = addDays(newFrom, 13)
        break
      }
      case "monthly": {
        if (direction === 'previous') {
          newFrom = startOfMonth(subMonths(date.from, 1))
          newTo = endOfMonth(newFrom)
        } else {
          newFrom = startOfMonth(addMonths(date.from, 1))
          newTo = endOfMonth(newFrom)
        }
        break
      }
      default: {
        // For custom periods, move by the current period length
        const periodLength = differenceInDays(date.to, date.from)
        if (direction === 'previous') {
          newFrom = subDays(date.from, periodLength + 1)
          newTo = subDays(date.to, periodLength + 1)
        } else {
          newFrom = addDays(date.from, periodLength + 1)
          newTo = addDays(date.to, periodLength + 1)
        }
      }
    }

    setDate({ from: newFrom, to: newTo })
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {/* Pay Period Selector */}
      <div className="space-y-2">
        <Label htmlFor="pay-period">Pay Period</Label>
        <Select value={payPeriod} onValueChange={(value: PayPeriodType) => setPayPeriod(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select pay period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePeriod('previous')}
            disabled={!date?.from || !date?.to || payPeriod === "custom"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
                disabled={payPeriod === "custom"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "MMM d")}{" "}-{" "}{format(date.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(date.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePeriod('next')}
            disabled={!date?.from || !date?.to || payPeriod === "custom"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Worker Selector */}
      <div className="space-y-2">
        <Label htmlFor="worker-select">Worker</Label>
        <Select value={selectedWorker} onValueChange={setSelectedWorker}>
          <SelectTrigger>
            <SelectValue placeholder="Select worker" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {workers.map(worker => (
              <SelectItem key={worker.id} value={worker.id}>
                {worker.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payment Status Selector */}
      <div className="space-y-2">
        <Label htmlFor="payment-status">Payment Status</Label>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      {/* <div className="space-y-2">
        <Label htmlFor="search">Search Workers</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div> */}
    </div>
  )
}

