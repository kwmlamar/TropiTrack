"use client"

import { useEffect, useState } from "react"
import { MobileWorkerDetail } from "./mobile-worker-detail"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import WorkerDetails from "./worker-details"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

interface WorkerDetailPageClientProps {
  profile: UserProfileWithCompany
}

/**
 * Client wrapper that handles mobile vs desktop layout for the worker detail page.
 * - Mobile/PWA: Shows optimized mobile worker detail view
 * - Desktop: Shows standard worker details within dashboard layout
 */
export function WorkerDetailPageClient({ profile }: WorkerDetailPageClientProps) {
  const isPWA = isPWAStandalone()
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const windowWidth = window.innerWidth
      setIsMobile(isPWA || windowWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [isPWA])

  // Still detecting - show loading spinner
  if (isMobile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Mobile: render the full mobile worker detail experience
  if (isMobile) {
    return <MobileWorkerDetail />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient profile={profile} title="Worker Details">
      <WorkerDetails />
    </DashboardLayoutClient>
  )
}
