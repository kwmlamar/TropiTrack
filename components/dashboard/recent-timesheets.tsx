"use client"

import { MoreHorizontal, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useEffect, useState, useCallback } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import type { TimesheetWithDetails } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

interface RecentTimesheetsProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function RecentTimesheets({ viewMode, selectedDate, isLoading }: RecentTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const getDateRange = () => {
    switch (viewMode) {
      case "daily":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        }
      case "weekly":
        return {
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate)
        }
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        }
    }
  }

  const loadRecentTimesheets = useCallback(async () => {
    try {
      setError(null)
      const profile = await getUserProfileWithCompany()
      if (!profile) {
        setError("No profile found")
        return
      }

      const { start, end } = getDateRange()

      const result = await getTimesheets(profile.id, {
        limit: 5,
        date_from: format(start, 'yyyy-MM-dd'),
        date_to: format(end, 'yyyy-MM-dd')
      })

      if (result.success && result.data) {
        setTimesheets(result.data)
      } else {
        setError(result.error || "Failed to load timesheets")
      }
    } catch (error) {
      console.error('Failed to load recent timesheets:', error)
      setError("Failed to load timesheets")
    }
  }, [viewMode, selectedDate])

  useEffect(() => {
    if (!isLoading) {
      loadRecentTimesheets()
    }
  }, [loadRecentTimesheets, isLoading])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const filteredTimesheets = timesheets.filter(timesheet => {
    const searchLower = searchTerm.toLowerCase()
    return (
      timesheet.worker?.name.toLowerCase().includes(searchLower) ||
      timesheet.project?.name.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Latest time entries from your team</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search timesheets..." 
              className="w-full bg-background pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No timesheets found
            </div>
          ) : (
            filteredTimesheets.map((timesheet) => (
              <div key={timesheet.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {timesheet.worker?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{timesheet.worker?.name || "Unknown Worker"}</p>
                    <p className="text-sm text-muted-foreground">{timesheet.project?.name || "Unknown Project"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{timesheet.total_hours} hrs</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(timesheet.date), "MMM d, h:mm a")}</p>
                  </div>
                  <Badge
                    variant={
                      timesheet.supervisor_approval === "approved"
                        ? "default"
                        : timesheet.supervisor_approval === "pending"
                          ? "outline"
                          : "destructive"
                    }
                    className={
                      timesheet.supervisor_approval === "approved"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                        : timesheet.supervisor_approval === "pending"
                          ? "border-orange-200 text-orange-800 hover:bg-orange-100 dark:border-orange-800/30 dark:text-orange-400"
                          : ""
                    }
                  >
                    {timesheet.supervisor_approval.charAt(0).toUpperCase() + timesheet.supervisor_approval.slice(1)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
