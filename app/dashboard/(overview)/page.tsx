import DashboardLayout from "@/components/layouts/dashboard-layout";
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


export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader />

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <RecentTimesheets />
          </Suspense>

          <div className="grid gap-6 md:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ProjectProgress />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <WorkerAttendance />
            </Suspense>
          </div>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <QuickActions />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
            <PayrollSummary />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <UpcomingDeadlines />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
