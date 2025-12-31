"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MobileDashboard } from "./mobile-dashboard"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { useIsMobile } from "@/hooks/use-mobile"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

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
 */
interface DashboardHomeClientProps {
  profile: UserProfileWithCompany
}

export function DashboardHomeClient({ profile }: DashboardHomeClientProps) {
  const router = useRouter()
  const isPWA = isPWAStandalone()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount and mobile detection to initialize
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only redirect to desktop view after we've confirmed it's desktop
  // This prevents redirect loops on mobile devices
  useEffect(() => {
    if (!mounted) return

    // Wait a bit for mobile detection to complete
    const checkDesktop = setTimeout(() => {
      if (typeof window === 'undefined') return

      // Check window width directly (more reliable than hook state)
      const windowWidth = window.innerWidth
      
      // Only redirect if we're CERTAIN it's desktop:
      // - Not in PWA mode
      // - Window width is clearly desktop-sized (>= 768px)
      // - This ensures we don't redirect on mobile devices
      const isDesktop = !isPWA && windowWidth >= 768

      if (isDesktop) {
        router.replace("/dashboard/timesheets")
      }
    }, 200) // Small delay to ensure mobile detection completes and prevent flash

    return () => clearTimeout(checkDesktop)
  }, [mounted, isPWA, router])

  // Always render mobile dashboard
  // It will handle its own visibility logic
  // On desktop, the redirect above will send users to timesheets
  return <MobileDashboard profile={profile} />
}

