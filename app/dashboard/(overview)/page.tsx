import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { getMobileDashboardData } from "@/lib/data/mobile-dashboard"
import { redirect } from "next/navigation"

/**
 * Dashboard Home Page
 *
 * This is the main entry point for the dashboard.
 *
 * Behavior:
 * - Mobile/PWA: Shows the mobile-first dashboard with greeting and action buttons
 * - Desktop: Redirects to timesheets page (existing behavior)
 *
 * The mobile dashboard provides a native app-like experience with:
 * - Personalized time-based greeting
 * - Quick access to primary features (Time Clock, Directory, Payroll)
 * - Today's stats (workers clocked in, hours, active sites)
 * - Recent activity feed
 */
export default async function DashboardHome() {
  // Get user profile for mobile dashboard
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect("/login")
  }

  // Fetch mobile dashboard data (stats and activity)
  const dashboardData = await getMobileDashboardData(profile.company_id)

  // Server-side: We can't detect mobile/PWA here, so we'll let the client component handle it
  // The client component will show mobile dashboard on mobile/PWA, or redirect on desktop
  return (
    <DashboardHomeClient
      profile={profile}
      dashboardData={dashboardData.data}
    />
  )
}
