"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MobileAssetsPage } from "@/components/assets/mobile-assets-page"
import { MobileProjectsList } from "@/components/projects/mobile-projects-list"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import ProjectsTable from "@/components/projects/projects-table"
import { ProjectsHeaderActions } from "@/components/projects/projects-header-actions"
import { AssetsHeaderActions } from "@/components/assets/assets-header-actions"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import type { User } from "@supabase/supabase-js"

interface ProjectsPageClientProps {
  profile: UserProfileWithCompany
  user: User
}

/**
 * Projects Page Client Component
 *
 * Handles conditional rendering for the projects page:
 * - Mobile: Shows Assets hub by default, Projects list when ?view=list
 * - Desktop: Shows projects table within dashboard layout
 */
export function ProjectsPageClient({ profile, user }: ProjectsPageClientProps) {
  const isPWA = isPWAStandalone()
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const searchParams = useSearchParams()
  const viewList = searchParams.get("view") === "list"

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

  // Mobile: render mobile views without dashboard layout
  if (isMobile) {
    if (viewList) {
      return <MobileProjectsList userId={user.id} />
    }
    return <MobileAssetsPage />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient
      profile={profile}
      title="Projects"
      fullWidth={true}
      headerActions={<AssetsHeaderActions desktopActions={<ProjectsHeaderActions userId={user.id} />} />}
    >
      <ProjectsTable user={user} />
    </DashboardLayoutClient>
  )
}

