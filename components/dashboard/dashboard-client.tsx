"use client"

import { useState } from "react"
import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentTimesheets } from "@/components/dashboard/recent-timesheets"
import { WorkerAttendance } from "@/components/dashboard/worker-attendance"
import { PayrollSummary } from "@/components/dashboard/payroll-summary"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardClient() {
  const [selectedDate] = useState<Date>(new Date())

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <DashboardStats 
            viewMode="monthly" 
            selectedDate={selectedDate} 
          />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-3 mt-6 h-[400px]">
          <div className="md:col-span-2">
            <PayrollSummary />
          </div>
          
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <WorkerAttendance />
          </Suspense>
        </div>

        <div className="mt-6">
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <RecentTimesheets 
              viewMode="monthly" 
              selectedDate={selectedDate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 