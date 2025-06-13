"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Dynamically import recharts components with no SSR
const RechartsComponents = dynamic(
  () => import("@/components/charts/worker-attendance-chart").then((mod) => mod.WorkerAttendanceChart),
  { ssr: false }
)

export function WorkerAttendance() {
  // Mock data
  const data = [
    { name: "Present", value: 28, color: "#22c55e" },
    { name: "Late", value: 3, color: "#f59e0b" },
    { name: "Absent", value: 1, color: "#ef4444" },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Worker Attendance</CardTitle>
        <CardDescription>Today's attendance summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <RechartsComponents data={data} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">32</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On Site</p>
            <p className="text-lg font-bold">31</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="text-lg font-bold">97%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
