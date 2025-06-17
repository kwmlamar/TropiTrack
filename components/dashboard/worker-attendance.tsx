"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/client"

// Dynamically import recharts components with no SSR
const RechartsComponents = dynamic(
  () => import("@/components/charts/worker-attendance-chart").then((mod) => mod.WorkerAttendanceChart),
  { ssr: false }
)

export function WorkerAttendance() {
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Get today's date
        const today = new Date()
        const formattedDate = format(today, "yyyy-MM-dd")

        // Fetch timesheets for today
        const response = await getTimesheets(user.id, {
          date_from: formattedDate,
          date_to: formattedDate
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
  }, [])

  const chartData = [
    { name: "Present", value: attendanceData.present, color: "#22c55e" },
    { name: "Late", value: attendanceData.late, color: "#f59e0b" },
    { name: "Absent", value: attendanceData.absent, color: "#ef4444" },
  ]

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Worker Attendance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Worker Attendance</CardTitle>
        <CardDescription>Today&apos;s attendance summary</CardDescription>
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
