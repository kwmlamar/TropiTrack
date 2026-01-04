"use client"

import { useEffect, useState } from "react"
import { ProfileForm } from "./profile-form"
import { MobileProfileForm } from "./mobile-profile-form"
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

interface ProfilePageClientProps {
  profile: UserProfileWithCompany
}

/**
 * Client wrapper that handles mobile vs desktop layout for the profile page.
 * - Mobile/PWA: Shows optimized mobile profile form with its own layout
 * - Desktop: Shows standard profile form within the dashboard layout
 */
export function ProfilePageClient({ profile }: ProfilePageClientProps) {
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

  // Mobile: render the full mobile profile experience
  if (isMobile) {
    return <MobileProfileForm initialProfile={profile} />
  }

  // Desktop: render with dashboard layout
  return (
    <DashboardLayoutClient profile={profile} title="Profile">
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-gray-500">
            Manage your personal information and account settings.
          </p>
        </div>
        <ProfileForm initialProfile={profile} />
      </div>
    </DashboardLayoutClient>
  )
}
