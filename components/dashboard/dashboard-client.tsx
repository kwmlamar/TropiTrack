"use client"

import { useState } from "react"
import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentTimesheets } from "@/components/dashboard/recent-timesheets"
import { WorkerAttendance } from "@/components/dashboard/worker-attendance"
import { PayrollSummary } from "@/components/dashboard/payroll-summary"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly" | "yearly"

export function DashboardClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly")
  const [selectedDate] = useState<Date>(new Date())

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <DashboardStats 
            viewMode={viewMode as "daily" | "weekly" | "monthly"} 
            selectedDate={selectedDate} 
          />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-3 mt-6 h-[400px]">
          <div className="md:col-span-2">
            <PayrollSummary 
              viewMode={viewMode as "weekly" | "monthly" | "yearly"} 
              selectedDate={selectedDate} 
            />
          </div>
          
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <WorkerAttendance 
              viewMode={viewMode as "daily" | "weekly" | "monthly"} 
              selectedDate={selectedDate}
              onViewModeChange={(mode) => setViewMode(mode as ViewMode)}
            />
          </Suspense>
        </div>

        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <RecentTimesheets 
              viewMode={viewMode as "daily" | "weekly" | "monthly"} 
              selectedDate={selectedDate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 