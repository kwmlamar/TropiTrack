"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MobileDashboard } from "./mobile-dashboard"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { useIsMobile } from "@/hooks/use-mobile"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import type { MobileDashboardData } from "@/lib/data/mobile-dashboard"
import { LoadingScreen } from "@/components/loading-screen"

/**
 * Dashboard Home Client Component
 *
 * Handles the conditional rendering logic for the dashboard home page:
 * - Shows mobile dashboard on mobile screens or PWA standalone mode
 * - Redirects to timesheets on desktop (maintains existing behavior)
 *
 * This separation allows us to:
 * - Keep server-side profile fetching
 * - Handle client-side mobile/PWA detection
 * - Provide different experiences for mobile vs desktop
 * - Prevent mobile UI from flashing on desktop during auth/loading
 */
interface DashboardHomeClientProps {
  profile: UserProfileWithCompany
  dashboardData?: MobileDashboardData | null
}

export function DashboardHomeClient({ profile, dashboardData }: DashboardHomeClientProps) {
  const router = useRouter()
  const isPWA = isPWAStandalone()
  const isMobile = useIsMobile()
  const [deviceTypeResolved, setDeviceTypeResolved] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Wait for viewport detection to complete before rendering
  useEffect(() => {
    // Only proceed once we know the device type
    if (isMobile !== null) {
      setDeviceTypeResolved(true)
      
      // Immediately determine if desktop and set state
      if (typeof window !== 'undefined') {
        const windowWidth = window.innerWidth
        const desktop = !isPWA && isMobile === false && windowWidth >= 768
        setIsDesktop(desktop)
      }
    }
  }, [isMobile, isPWA])

  // Use useLayoutEffect for redirect to happen synchronously before paint
  // This prevents any visual flash of mobile UI on desktop
  useLayoutEffect(() => {
    if (!deviceTypeResolved) return
    if (typeof window === 'undefined') return
    if (!isDesktop) return

    // Redirect immediately if desktop - this runs before paint
    router.replace("/dashboard/timesheets")
  }, [deviceTypeResolved, isDesktop, router])

  // Show loading screen until device type is resolved
  // This prevents mobile UI from flashing on desktop
  if (!deviceTypeResolved) {
    // For PWA, show the branded loading screen
    if (isPWA) {
      return <LoadingScreen />
    }
    // For web, show a neutral loading state (blank or minimal)
    // This prevents any mobile UI from appearing
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {/* Minimal loading state for desktop web */}
      </div>
    )
  }

  // If desktop, show loading state while redirecting (don't render mobile UI at all)
  if (isDesktop) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {/* Loading state while redirecting desktop users */}
      </div>
    )
  }

  // Only render mobile dashboard if we're confirmed to be mobile/PWA
  // This prevents any flash of mobile UI on desktop
  return <MobileDashboard profile={profile} dashboardData={dashboardData} />
}

