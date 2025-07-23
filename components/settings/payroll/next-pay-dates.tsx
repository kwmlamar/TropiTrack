"use client"

import { format } from "date-fns"
import { CalendarDays } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"
import { getNextPayDates, formatPayDay } from "@/lib/utils/payroll"

interface NextPayDatesProps {
  schedule: PaymentSchedule
}

export function NextPayDates({ schedule }: NextPayDatesProps) {
  const nextDates = getNextPayDates(schedule, 3)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />
          Upcoming Pay Dates
        </CardTitle>
        <CardDescription>
          Next {nextDates.length} pay dates based on your schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {nextDates.map((date, index) => (
            <div
              key={date.toISOString()}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm text-gray-500">
                {index === 0 ? "Next" : index === 1 ? "Following" : "Third"} Pay Date
              </span>
              <span className="font-medium">
                {format(date, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          ))}
          <div className="mt-4 pt-3 border-t text-sm text-gray-500">
            Payments scheduled for{" "}
            {schedule.pay_day_type === "day_of_month"
              ? `the ${formatPayDay(schedule.pay_day, "day_of_month")} of each month`
              : `every ${schedule.pay_period_type === "weekly" ? "" : "other "}${formatPayDay(
                  schedule.pay_day,
                  "day_of_week"
                )}`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 