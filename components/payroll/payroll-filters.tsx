"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
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
}

export function PayrollFilters({ workers, date, setDate }: PayrollFiltersProps) {
  const [payPeriod, setPayPeriod] = useState("bi-weekly")
  const [selectedWorker, setSelectedWorker] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")

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
