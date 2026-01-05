"use client"

import { useEffect, useState } from "react"
import { MobileWorkersList } from "./mobile-workers-list"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import WorkersTable from "./worker-table"
import { WorkersHeaderActions } from "./workers-header-actions"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import type { User } from "@supabase/supabase-js"

interface WorkersPageClientProps {
  profile: UserProfileWithCompany
  user: User
}

/**
 * Client wrapper that handles mobile vs desktop layout for the workers page.
 * - Mobile/PWA: Shows optimized mobile workers list
 * - Desktop: Shows standard workers table within dashboard layout
 */
export function WorkersPageClient({ profile, user }: WorkersPageClientProps) {
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

  // Mobile: render the full mobile workers experience
  if (isMobile) {
    return <MobileWorkersList userId={user.id} />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient
      profile={profile}
      title="Workers"
      fullWidth={true}
      headerActions={<WorkersHeaderActions userId={user.id} />}
    >
      <WorkersTable user={user} />
    </DashboardLayoutClient>
  )
}
