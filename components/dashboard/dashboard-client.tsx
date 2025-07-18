"use client"

import { useState } from "react"
import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentTimesheets } from "@/components/dashboard/recent-timesheets"
import { WorkerAttendance } from "@/components/dashboard/worker-attendance"
import { PayrollSummary } from "@/components/dashboard/payroll-summary"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getCurrentLocalDate } from "@/lib/utils"

// Dashboard Loading Skeleton Component
const DashboardSkeleton = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#E8EDF5] dark:bg-[#E8EDF5] border-0 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-1">
                  <div className="h-3 w-20 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
                  <div className="h-6 w-16 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payroll Summary and Worker Attendance Grid */}
        <div className="grid gap-4 md:grid-cols-3 mt-6 h-[400px]">
          {/* Payroll Summary Skeleton */}
          <div className="md:col-span-2">
            <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-6 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-4 w-48 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] animate-pulse rounded-lg bg-muted-foreground/20 dark:bg-muted/50" />
              </CardContent>
            </Card>
          </div>
          
          {/* Worker Attendance Skeleton */}
          <div>
            <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none h-full">
              <CardHeader className="pb-2">
                <div className="space-y-1">
                  <div className="h-6 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
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
          </div>
        </div>

        {/* Recent Timesheets Skeleton */}
        <div className="mt-6">
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-6 w-40 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-60 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-8 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Table Header Skeleton */}
              <div className="border-b">
                <div className="grid grid-cols-6 gap-4 p-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
              </div>
              
              {/* Table Rows Skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="grid grid-cols-6 gap-4 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-muted-foreground/20 dark:bg-muted/50 rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                        <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-4 w-12 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-6 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function DashboardClient() {
  // Create a date that represents the current day in the user's local timezone
  // This ensures we're working with the correct day regardless of server timezone
  const [selectedDate] = useState<Date>(getCurrentLocalDate())

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardStats 
            viewMode="monthly" 
            selectedDate={selectedDate} 
          />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-3 mt-6 h-[400px]">
          <div className="md:col-span-2">
            <PayrollSummary />
          </div>
          
          <Suspense fallback={<DashboardSkeleton />}>
            <WorkerAttendance />
          </Suspense>
        </div>

        <div className="mt-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <RecentTimesheets 
              selectedDate={selectedDate}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 