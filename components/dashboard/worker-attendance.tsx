"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { createClient } from "@/utils/supabase/client"

// Dynamically import recharts components with no SSR
const RechartsComponents = dynamic(
  () => import("@/components/charts/worker-attendance-chart").then((mod) => mod.WorkerAttendanceChart),
  { ssr: false }
)

type ViewMode = "daily" | "weekly" | "monthly"

interface WorkerAttendanceProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function WorkerAttendance({ viewMode, selectedDate }: WorkerAttendanceProps) {
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
  }, [viewMode, selectedDate])

  const chartData = [
    { name: "Present", value: attendanceData.present, color: "#10b981" },
    { name: "Late", value: attendanceData.late, color: "#f59e0b" },
    { name: "Absent", value: attendanceData.absent, color: "#ef4444" },
  ]

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
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle>Worker Attendance</CardTitle>
          <CardDescription>
            {viewMode === "daily" ? "Today's" : viewMode === "weekly" ? "This week's" : "This month's"} attendance summary
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <RechartsComponents data={chartData} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{attendanceData.total}</p>
          </div>
          <div className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">On Site</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{attendanceData.onSite}</p>
          </div>
          <div className="rounded-lg border p-3 text-center transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">Utilization</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{attendanceData.utilization}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
