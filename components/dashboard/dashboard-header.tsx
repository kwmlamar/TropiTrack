"use client"

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
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
  onViewModeChange,
  onDateChange,
  initialViewMode = "weekly",
  initialDate = new Date()
}: DashboardHeaderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [date, setDate] = useState<Date>(initialDate)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const profileData = await getUserProfile()
      setProfile(profileData)
    }
    
    fetchUserProfile()
  }, [])

  useEffect(() => {
    onViewModeChange?.(viewMode)
  }, [viewMode, onViewModeChange])

  useEffect(() => {
    onDateChange?.(date)
  }, [date, onDateChange])

  const handlePreviousPeriod = () => {
    switch (viewMode) {
      case "daily":
        setDate(subDays(date, 1))
        break
      case "weekly":
        setDate(subWeeks(date, 1))
        break
      case "monthly":
        setDate(subMonths(date, 1))
        break
    }
  }

  const handleNextPeriod = () => {
    switch (viewMode) {
      case "daily":
        setDate(addDays(date, 1))
        break
      case "weekly":
        setDate(addWeeks(date, 1))
        break
      case "monthly":
        setDate(addMonths(date, 1))
        break
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const getDateDisplay = () => {
    switch (viewMode) {
      case "daily":
        return format(date, "PPP")
      case "weekly":
        const weekStart = subDays(date, date.getDay())
        const weekEnd = addDays(weekStart, 6)
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      case "monthly":
        return format(date, "MMMM yyyy")
    }
  }

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-4 mb-4">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{profile?.name || 'User'}</span>
          </p>
        </div>
      </div>

      
    </div>
  )
}
