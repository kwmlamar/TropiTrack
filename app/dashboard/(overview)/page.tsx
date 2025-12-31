import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
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
 * - Clean, minimal design optimized for mobile screens
 */
export default async function DashboardHome() {
  // Get user profile for mobile dashboard
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect('/login')
  }

  // Server-side: We can't detect mobile/PWA here, so we'll let the client component handle it
  // The client component will show mobile dashboard on mobile/PWA, or redirect on desktop
  return <DashboardHomeClient profile={profile} />
}
