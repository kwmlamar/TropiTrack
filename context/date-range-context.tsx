"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { DateRange } from "react-day-picker"
import { startOfWeek, endOfWeek } from "date-fns"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

interface DateRangeContextType {
  dateRange: DateRange | undefined
  setDateRange: (dateRange: DateRange | undefined) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const { paymentSchedule } = usePayrollSettings()
  
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

  // Get default date range based on payment schedule
  const getDefaultDateRange = (): DateRange => {
    const today = new Date()
    const weekStartsOn = getWeekStartsOn()
    return {
      from: startOfWeek(today, { weekStartsOn }),
      to: endOfWeek(today, { weekStartsOn }),
    }
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultDateRange())

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
} 