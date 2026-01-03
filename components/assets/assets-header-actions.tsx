"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { isPWAStandalone } from "@/lib/utils/pwa"

/**
 * Assets Header Actions Component
 * 
 * Conditionally renders header actions based on device:
 * - Mobile/PWA: Returns null (no header actions, search bar is in content)
 * - Desktop: Shows the provided desktop actions (e.g., "New Project" button)
 */
interface AssetsHeaderActionsProps {
  desktopActions: React.ReactNode
}

export function AssetsHeaderActions({ desktopActions }: AssetsHeaderActionsProps) {
  const isPWA = isPWAStandalone()
  const isMobile = useIsMobile()

  // Hide header actions on mobile/PWA (search bar is in content area)
  if (isMobile || isPWA) {
    return null
  }

  // Show desktop actions on desktop
  return <>{desktopActions}</>
}

