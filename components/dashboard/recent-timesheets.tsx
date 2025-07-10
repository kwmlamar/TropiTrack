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
import { cn } from "@/lib/utils"

type ViewMode = "daily" | "weekly" | "monthly"

interface RecentTimesheetsProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function RecentTimesheets({ viewMode, selectedDate }: RecentTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [viewMode, selectedDate, getDateRange])

  useEffect(() => {
    loadRecentTimesheets()
  }, [loadRecentTimesheets])

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

  if (loading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-7 w-40 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-4 w-60 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-9 flex-1 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            <div className="h-9 w-9 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Latest time entries from your team</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-9">
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
              className="w-full bg-background pl-8 h-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <p className="font-medium">Failed to load timesheets</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="font-medium">No timesheets found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredTimesheets.map((timesheet) => (
              <div 
                key={timesheet.id} 
                className="group flex items-center justify-between rounded-lg border p-3 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-foreground">{timesheet.worker?.name || "Unknown Worker"}</p>
                    <p className="text-sm text-muted-foreground">{timesheet.project?.name || "Unknown Project"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{timesheet.total_hours} hrs</p>
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
                    className={cn(
                      "transition-colors",
                      timesheet.supervisor_approval === "approved"
                        ? "bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30"
                        : timesheet.supervisor_approval === "pending"
                          ? "border-warning/30 text-warning hover:bg-warning/10 dark:border-warning/40 dark:text-warning-foreground dark:hover:bg-warning/20"
                          : ""
                    )}
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
