"use client"

import { useEffect, useState } from "react"
import { MobileClientsList } from "./mobile-clients-list"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import ClientTable from "./client-table"
import { ClientsHeaderActions } from "./clients-header-actions"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import type { User } from "@supabase/supabase-js"

interface ClientsPageClientProps {
  profile: UserProfileWithCompany
  user: User
}

/**
 * Clients Page Client Component
 *
 * Handles conditional rendering for the clients page:
 * - Mobile/PWA: Shows mobile clients list without dashboard layout
 * - Desktop: Shows clients table within dashboard layout
 */
export function ClientsPageClient({ profile, user }: ClientsPageClientProps) {
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

  // Mobile: render mobile view without dashboard layout
  if (isMobile) {
    return <MobileClientsList />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient
      profile={profile}
      title="Clients"
      fullWidth={true}
      headerActions={<ClientsHeaderActions userId={user.id} />}
    >
      <ClientTable user={user} />
    </DashboardLayoutClient>
  )
}
