"use client"

import { useState } from "react"
import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentTimesheets } from "@/components/dashboard/recent-timesheets"
import { ProjectProgress } from "@/components/dashboard/project-progress"
import { WorkerAttendance } from "@/components/dashboard/worker-attendance"
import { PayrollSummary } from "@/components/dashboard/payroll-summary"
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

export function DashboardClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading] = useState(false)

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader 
        onViewModeChange={handleViewModeChange}
        onDateChange={handleDateChange}
        initialViewMode={viewMode}
        initialDate={selectedDate}
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <DashboardStats viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
        </Suspense>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <div className="space-y-6 lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <RecentTimesheets viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
            </Suspense>

            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <ProjectProgress viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
              </Suspense>

              <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <WorkerAttendance viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
              </Suspense>
            </div>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <QuickActions />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
              <PayrollSummary viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
              <UpcomingDeadlines viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <RecentActivity viewMode={viewMode} selectedDate={selectedDate} isLoading={isLoading} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
} 