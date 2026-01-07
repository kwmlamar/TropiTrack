"use client"

import { useRouter } from "next/navigation"
import { ClipboardList, Users, DollarSign, Clock, ChevronRight } from "lucide-react"
import { getPersonalizedGreeting, getFirstName } from "@/lib/utils/greetings"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import type { MobileDashboardData } from "@/lib/data/mobile-dashboard"

/**
 * Formats a date for display in the dashboard header.
 * Example output: "Friday, January 3"
 */
function formatDashboardDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

/**
 * Mobile Dashboard Component
 *
 * An admin-focused dashboard for construction company owners/foremen:
 * - Primary action: Log Hours (record worker time)
 * - Secondary actions: Workers, Payroll
 * - Today's stats: entries logged, workers covered
 * - Pending approvals (conditional)
 *
 * Key principle: Admin logs hours on behalf of workers.
 * Workers are assigned to projects dynamically day by day.
 */
interface MobileDashboardProps {
  profile: UserProfileWithCompany
  dashboardData?: MobileDashboardData | null
}

export function MobileDashboard({ profile, dashboardData }: MobileDashboardProps) {
  const router = useRouter()

  // Extract first name from full name
  const firstName = getFirstName(profile.name)

  // Get personalized greeting and current date
  const greeting = getPersonalizedGreeting(firstName)
  const today = formatDashboardDate(new Date())

  // Extract stats with fallbacks
  const stats = dashboardData?.todayStats ?? {
    entriesToday: 0,
    workersLogged: 0,
    totalHours: 0,
  }
  const approvals = dashboardData?.pendingApprovals ?? {
    count: 0,
    enabled: false,
  }

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-28">
      {/* Greeting Header */}
      <div className="bg-white border-b border-gray-200 px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {greeting}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1">{today}</p>
      </div>

      {/* Primary Action: Log Hours */}
      <div className="px-5 pt-5">
        <button
          onClick={() => handleNavigate("/dashboard/timesheets/new")}
          className="w-full bg-[#2596be] hover:bg-[#1e7a9a] text-white
                     rounded-xl p-4 shadow-md shadow-[#2596be]/20
                     flex items-center gap-4
                     transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-lg font-semibold block">Log Hours</span>
            <span className="text-sm text-white/80">Record worker time</span>
          </div>
        </button>
      </div>

      {/* Secondary Actions Row */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleNavigate("/dashboard/workers")}
            className="bg-white border border-gray-200 rounded-xl p-4
                       flex flex-col items-center justify-center gap-2
                       shadow-sm transition-all active:scale-[0.97] active:bg-gray-50"
          >
            <Users className="w-6 h-6 text-[#2596be]" />
            <span className="text-sm font-semibold text-gray-900">Workers</span>
          </button>

          <button
            onClick={() => handleNavigate("/dashboard/payroll")}
            className="bg-white border border-gray-200 rounded-xl p-4
                       flex flex-col items-center justify-center gap-2
                       shadow-sm transition-all active:scale-[0.97] active:bg-gray-50"
          >
            <DollarSign className="w-6 h-6 text-[#2596be]" />
            <span className="text-sm font-semibold text-gray-900">Payroll</span>
          </button>
        </div>
      </div>

      {/* Today Section */}
      <div className="px-5 pt-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Today
        </h2>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Entries Today */}
          <button
            onClick={() => handleNavigate("/dashboard/timesheets")}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left
                       transition-all active:scale-[0.97] active:bg-gray-50"
          >
            <p className="text-3xl font-bold text-gray-900">
              {stats.entriesToday}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.entriesToday === 1 ? "entry" : "entries"} today
            </p>
          </button>

          {/* Workers Logged */}
          <button
            onClick={() => handleNavigate("/dashboard/timesheets")}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left
                       transition-all active:scale-[0.97] active:bg-gray-50"
          >
            <p className="text-3xl font-bold text-gray-900">
              {stats.workersLogged}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.workersLogged === 1 ? "worker" : "workers"} logged
            </p>
          </button>
        </div>

        {/* Hours Summary (subtle, informational) */}
        {stats.totalHours > 0 && (
          <div className="flex items-center gap-2 px-1 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {stats.totalHours} hours logged today
            </span>
          </div>
        )}

        {/* Pending Approvals Card (Conditional) */}
        {approvals.enabled && approvals.count > 0 && (
          <button
            onClick={() => handleNavigate("/dashboard/approvals")}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4
                       flex items-center justify-between
                       transition-all active:scale-[0.98] active:bg-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {approvals.count} pending approval
                </p>
                <p className="text-xs text-gray-500">Review and approve</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}

        {/* All Approved State */}
        {approvals.enabled && approvals.count === 0 && stats.entriesToday > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700">All entries approved</p>
          </div>
        )}

        {/* Empty State */}
        {stats.entriesToday === 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center mt-3">
            <p className="text-sm text-gray-500">No entries yet today</p>
            <p className="text-xs text-gray-400 mt-1">
              Tap &quot;Log Hours&quot; to get started
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
