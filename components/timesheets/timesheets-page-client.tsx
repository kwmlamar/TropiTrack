"use client"

import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { MobileTimesheetsPage } from "./mobile-timesheets-page"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import TimesheetsPage from "./timesheets-page"
import { TimesheetsHeaderActions } from "./timesheets-header-actions"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

interface TimesheetsPageClientProps {
  profile: UserProfileWithCompany
  user: User
}

/**
 * Client wrapper that handles mobile vs desktop layout for the timesheets page.
 * - Mobile/PWA: Shows optimized mobile timesheets experience
 * - Desktop: Shows standard timesheets table within dashboard layout
 */
export function TimesheetsPageClient({ profile, user }: TimesheetsPageClientProps) {
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

  // Mobile: render the full mobile timesheets experience
  if (isMobile) {
    return <MobileTimesheetsPage userId={user.id} />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient
      profile={profile}
      title="Timesheets"
      fullWidth={true}
      headerActions={<TimesheetsHeaderActions />}
    >
      <TimesheetsPage user={user} />
    </DashboardLayoutClient>
  )
}
