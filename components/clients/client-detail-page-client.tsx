"use client"

import { useEffect, useState } from "react"
import { MobileClientDetail } from "./mobile-client-detail"
import { isPWAStandalone } from "@/lib/utils/pwa"

interface ClientDetailPageClientProps {
  children: React.ReactNode
}

/**
 * Client wrapper that handles mobile vs desktop layout for the client detail page.
 * - Mobile/PWA: Shows optimized mobile client detail view
 * - Desktop: Shows standard client details within dashboard layout (passed as children)
 */
export function ClientDetailPageClient({ children }: ClientDetailPageClientProps) {
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

  // Mobile: render the mobile client detail experience
  if (isMobile) {
    return <MobileClientDetail />
  }

  // Desktop: render the existing desktop layout (passed as children)
  return <>{children}</>
}
