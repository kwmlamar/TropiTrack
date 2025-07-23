"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { getCurrentLocalDate } from "@/lib/utils"

type ViewMode = "daily" | "weekly" | "monthly"

interface AttendanceData {
  present: number
  late: number
  absent: number
  total: number
  utilization: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WorkerAttendanceProps {
  // Props can be added here in the future if needed
}

export function WorkerAttendance({}: WorkerAttendanceProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    utilization: 0
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")
  // Create a date that represents the current day in the user's local timezone
  // This ensures we're working with the correct day regardless of server timezone
  const [selectedDate] = useState<Date>(getCurrentLocalDate())
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
        console.log('Date range:', { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") })

        // Fetch timesheets for the selected period
        const response = await getTimesheets(user.id, {
          date_from: format(start, "yyyy-MM-dd"),
          date_to: format(end, "yyyy-MM-dd")
        })

        if (response.success && response.data) {
          const timesheets = response.data
          console.log('Fetched timesheets:', timesheets.length)
          
          // Group by worker to avoid duplicates and count attendance status
          const workerAttendance = new Map<string, { present: boolean; late: boolean; hours: number }>()
          
          timesheets.forEach(ts => {
            const workerId = ts.worker_id
            const hours = ts.total_hours || 0
            const isLate = ts.notes?.toLowerCase().includes("late") || false
            const isPresent = hours > 0
            
            if (!workerAttendance.has(workerId)) {
              workerAttendance.set(workerId, { present: isPresent, late: isLate, hours })
            }
          })
          
          const attendance = Array.from(workerAttendance.values())
          const present = attendance.filter(a => a.present && !a.late).length
          const late = attendance.filter(a => a.present && a.late).length
          const absent = attendance.filter(a => !a.present).length
          const total = present + late + absent
          const utilization = total > 0 ? Math.round(((present + late) / total) * 100) : 0

          console.log('Attendance data:', { present, late, absent, total, utilization })

          setAttendanceData({
            present,
            late,
            absent,
            total,
            utilization
          })
        } else {
          console.log('No timesheet data available')
          // Set default data to show empty chart
          setAttendanceData({
            present: 0,
            late: 0,
            absent: 0,
            total: 0,
            utilization: 0
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



  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
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
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-6 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="h-full min-h-[200px] flex flex-col">
            {/* Pie Chart Skeleton */}
            <div className="flex-1 h-full flex items-center justify-center">
              <div className="relative">
                {/* Outer circle */}
                <div className="w-32 h-32 rounded-full border-8 border-muted-foreground/20 dark:border-muted/50 animate-pulse"></div>
                {/* Inner circle */}
                <div className="absolute inset-4 w-24 h-24 rounded-full bg-muted-foreground/20 dark:bg-muted/50 animate-pulse"></div>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-4 w-12 mx-auto mb-1 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50"></div>
                    <div className="h-3 w-8 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend Skeleton */}
            <div className="mt-4 flex justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/20 dark:bg-muted/50 animate-pulse"></div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50"></div>
                </div>
              ))}
            </div>
            
            {/* Stats Skeleton */}
            <div className="mt-4 text-center">
              <div className="h-6 w-32 mx-auto mb-1 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50"></div>
              <div className="h-4 w-24 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50"></div>
            </div>
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
        <div className="h-full min-h-[200px] flex flex-col">
          {attendanceData.total === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="font-medium">No attendance data</p>
                <p className="text-sm">No timesheets found for the selected period</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Attendance Pie Chart */}
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Present", value: attendanceData.present, color: "#10b981" },
                        { name: "Late", value: attendanceData.late, color: "#f59e0b" },
                        { name: "Absent", value: attendanceData.absent, color: "#ef4444" }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: "Present", value: attendanceData.present, color: "#10b981" },
                        { name: "Late", value: attendanceData.late, color: "#f59e0b" },
                        { name: "Absent", value: attendanceData.absent, color: "#ef4444" }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} workers`, name]}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "1rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              

              
              {/* Stats */}
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">{attendanceData.total} Total Workers</p>
                <p className="text-sm text-gray-500">{attendanceData.utilization}% Utilization</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
