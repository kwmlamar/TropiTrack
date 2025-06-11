"use client"

import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Worker } from "@/lib/types/worker"

interface PayrollFiltersProps {
  workers: Worker[];
  date: DateRange | undefined;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  setPayPeriodType: React.Dispatch<React.SetStateAction<string>>;
}

export function PayrollFilters({ workers, date, setDate, setPayPeriodType }: PayrollFiltersProps) {
  const [payPeriod, setPayPeriod] = useState("bi-weekly")
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")

  useEffect(() => {
    const today = new Date();
    let newDateRange: DateRange | undefined;

    switch (payPeriod) {
      case "weekly":
        newDateRange = {
          from: startOfWeek(today, { weekStartsOn: 1 }), // Monday as start of week
          to: endOfWeek(today, { weekStartsOn: 1 }),
        };
        break;
      case "bi-weekly":
        // Assuming bi-weekly periods start on a Monday and run for two weeks
        // This might need adjustment based on the company's specific pay period start date
        const twoWeeksAgo = subWeeks(today, 1);
        newDateRange = {
          from: startOfWeek(twoWeeksAgo, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 }),
        };
        break;
      case "monthly":
        newDateRange = {
          from: startOfMonth(today),
          to: endOfMonth(today),
        };
        break;
      case "custom":
        // Do not set date automatically for custom range
        newDateRange = undefined; // Clear the date if selecting custom
        break;
      default:
        // Default to bi-weekly for initial load or unknown value
        const defaultTwoWeeksAgo = subWeeks(today, 1);
        newDateRange = {
          from: startOfWeek(defaultTwoWeeksAgo, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 }),
        };
        break;
    }

    // Only update date if it's not a custom range, or if it's the initial load
    // This prevents clearing the date picker when 'custom' is selected and dates are already set.
    if (payPeriod !== "custom" || (payPeriod === "custom" && !date?.from && !date?.to)) {
      setDate(newDateRange);
    }

    setPayPeriodType(payPeriod);

  }, [payPeriod, setDate, setPayPeriodType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Pay Period Selector */}
      <div className="space-y-2">
        <Label htmlFor="pay-period">Pay Period</Label>
        <Select value={payPeriod} onValueChange={setPayPeriod}>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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
