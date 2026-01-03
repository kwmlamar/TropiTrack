"use client"

import { useEffect, useState } from "react"
import { MobileAssetsPage } from "@/components/assets/mobile-assets-page"
import ProjectsTable from "@/components/projects/projects-table"
import { User } from "@supabase/supabase-js"
import { useIsMobile } from "@/hooks/use-mobile"
import { isPWAStandalone } from "@/lib/utils/pwa"

/**
 * Projects Page Client Component
 * 
 * Handles conditional rendering for the projects page:
 * - Shows mobile assets page on mobile screens or PWA standalone mode
 * - Shows projects table on desktop (existing behavior)
 * 
 * This allows us to:
 * - Keep server-side data fetching in the page component
 * - Handle client-side mobile/PWA detection
 * - Provide different experiences for mobile vs desktop
 */
interface ProjectsPageClientProps {
  user: User
}

export function ProjectsPageClient({ user }: ProjectsPageClientProps) {
  const isPWA = isPWAStandalone()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount and mobile detection to initialize
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we should show mobile assets page
  // Show on mobile screens OR in PWA standalone mode
  const shouldShowMobile = isMobile || isPWA

  // Show mobile assets page on mobile/PWA
  // Show projects table on desktop
  if (mounted && shouldShowMobile) {
    return <MobileAssetsPage />
  }

  // On desktop, show the existing projects table
  return <ProjectsTable user={user} />
}

