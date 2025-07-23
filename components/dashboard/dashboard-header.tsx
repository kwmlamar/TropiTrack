"use client"

import { useState, useEffect } from "react"
import { getUserProfile } from "@/lib/data/userProfiles"
import { UserProfile } from "@/lib/types/userProfile"

type ViewMode = "daily" | "weekly" | "monthly"

interface DashboardHeaderProps {
  onViewModeChange?: (mode: ViewMode) => void
  onDateChange?: (date: Date) => void
  initialViewMode?: ViewMode
  initialDate?: Date
}

export function DashboardHeader({
}: DashboardHeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const profileData = await getUserProfile()
      setProfile(profileData)
    }
    
    fetchUserProfile()
  }, [])

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-4 mb-4">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <p className="text-gray-500">
            Welcome back, <span className="font-medium text-foreground">{profile?.name || 'User'}</span>
          </p>
        </div>
      </div>

      
    </div>
  )
}
