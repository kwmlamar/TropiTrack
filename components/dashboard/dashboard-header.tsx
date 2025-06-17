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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back {profile?.name}! Here&apos;s an overview of your construction operations.</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPeriod}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? getDateDisplay() : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPeriod}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-border/50 bg-card/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "daily" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleViewModeChange("daily")}
          >
            Daily
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "weekly" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleViewModeChange("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "monthly" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleViewModeChange("monthly")}
          >
            Monthly
          </Button>
        </div>
      </div>
    </div>
  )
}
