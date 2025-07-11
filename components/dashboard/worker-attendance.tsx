"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

type ViewMode = "daily" | "weekly" | "monthly"

interface WorkerAttendanceProps {
  viewMode: ViewMode
  selectedDate: Date
  onViewModeChange?: (mode: ViewMode) => void
}

export function WorkerAttendance({ viewMode, selectedDate, onViewModeChange }: WorkerAttendanceProps) {
  const [attendanceData, setAttendanceData] = useState<{
    present: number
    late: number
    absent: number
    total: number
    onSite: number
    utilization: number
  }>({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    onSite: 0,
    utilization: 0
  })
  const [loading, setLoading] = useState(true)
  const { paymentSchedule } = usePayrollSettings()

  const getDateRange = useCallback(() => {
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

    switch (viewMode) {
      case "daily":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        }
      case "weekly":
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() }),
          end: endOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
        }
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        }
    }
  }, [viewMode, selectedDate, paymentSchedule])

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { start, end } = getDateRange()

        // Fetch timesheets for the selected period
        const response = await getTimesheets(user.id, {
          date_from: format(start, "yyyy-MM-dd"),
          date_to: format(end, "yyyy-MM-dd")
        })

        if (response.success && response.data) {
          const timesheets = response.data
          
          // Count attendance status
          const counts = timesheets.reduce((acc, ts) => {
            if (ts.total_hours === 0) {
              acc.absent++
            } else if (ts.notes?.toLowerCase().includes("late")) {
              acc.late++
            } else {
              acc.present++
            }
            return acc
          }, { present: 0, late: 0, absent: 0 })

          // Calculate total and on-site workers
          const total = counts.present + counts.late + counts.absent
          const onSite = counts.present + counts.late
          const utilization = total > 0 ? Math.round((onSite / total) * 100) : 0

          setAttendanceData({
            ...counts,
            total,
            onSite,
            utilization
          })
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [viewMode, selectedDate, getDateRange])

  const chartData = [
    {
      name: "Attendance",
      present: attendanceData.present,
      late: attendanceData.late,
      absent: attendanceData.absent,
      total: attendanceData.total
    }
  ]

  interface TooltipProps {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      color: string
    }>
    label?: string
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">Attendance Breakdown</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} workers
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    }
  }

  const getPeriodDescription = () => {
    switch (viewMode) {
      case "daily":
        return "Today"
      case "weekly":
        return "This Week"
      case "monthly":
        return "This Month"
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="space-y-1">
            <div className="h-7 w-40 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            <div className="h-4 w-60 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse rounded-lg bg-muted-foreground/20 dark:bg-muted/50" />
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="h-4 w-16 mx-auto mb-2 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-6 w-12 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-medium">Worker Attendance</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {getPeriodDescription()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewModeChange("daily")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewModeChange("weekly")}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewModeChange("monthly")}>
                This Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
