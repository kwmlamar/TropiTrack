"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import recharts components with no SSR
const RechartsComponents = dynamic(
  () => import("@/components/charts/worker-attendance-chart").then((mod) => mod.WorkerAttendanceChart),
  { ssr: false }
)

type ViewMode = "daily" | "weekly" | "monthly"

interface WorkerAttendanceProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function WorkerAttendance({ viewMode, selectedDate, isLoading }: WorkerAttendanceProps) {
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

  const getDateRange = () => {
    switch (viewMode) {
      case "daily":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        }
      case "weekly":
        return {
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate)
        }
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        }
    }
  }

  useEffect(() => {
    if (!isLoading) {
      const fetchAttendanceData = async () => {
        try {
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
        }
      }

      fetchAttendanceData()
    }
  }, [viewMode, selectedDate, isLoading])

  const chartData = [
    { name: "Present", value: attendanceData.present, color: "#22c55e" },
    { name: "Late", value: attendanceData.late, color: "#f59e0b" },
    { name: "Absent", value: attendanceData.absent, color: "#ef4444" },
  ]

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Worker Attendance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted/50 rounded" />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-16 mx-auto mb-1" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Worker Attendance</CardTitle>
        <CardDescription>
          {viewMode === "daily" ? "Today's" : viewMode === "weekly" ? "This week's" : "This month's"} attendance summary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <RechartsComponents data={chartData} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{attendanceData.total}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On Site</p>
            <p className="text-lg font-bold">{attendanceData.onSite}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="text-lg font-bold">{attendanceData.utilization}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
