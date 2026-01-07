"use client"

import { useEffect, useState } from "react"
import { MobileProjectDetail } from "./mobile-project-detail"
import { isPWAStandalone } from "@/lib/utils/pwa"

interface ProjectDetailPageClientProps {
  children: React.ReactNode
}

/**
 * Client wrapper that handles mobile vs desktop layout for the project detail page.
 * - Mobile/PWA: Shows optimized mobile project detail view
 * - Desktop: Shows standard project details within dashboard layout (passed as children)
 */
export function ProjectDetailPageClient({ children }: ProjectDetailPageClientProps) {
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

  // Mobile: render the mobile project detail experience
  if (isMobile) {
    return <MobileProjectDetail />
  }

  // Desktop: render the existing desktop layout (passed as children)
  return <>{children}</>
}
