"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useCallback } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import type { TimesheetWithDetails } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Filter, Download } from "lucide-react"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

type ViewMode = "daily" | "weekly" | "monthly"

interface RecentTimesheetsProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function RecentTimesheets({ viewMode, selectedDate }: RecentTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")
  const { paymentSchedule } = usePayrollSettings()

  const loadRecentTimesheets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await getUserProfileWithCompany()
      if (!profile) {
        setError("No profile found")
        return
      }

      // Get week start day from payment schedule, default to Saturday for construction industry
      const getWeekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
        if (paymentSchedule?.period_start_type === "day_of_week") {
          const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
            1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
          }
          return dayMap[paymentSchedule.period_start_day] || 6
        }
        return 6 // Default to Saturday for construction industry
      }

      // Calculate date range directly within the function
      let start: Date, end: Date
      switch (viewMode) {
        case "daily":
          start = startOfDay(selectedDate)
          end = endOfDay(selectedDate)
          break
        case "weekly":
          start = startOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          end = endOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          break
        case "monthly":
          start = startOfMonth(selectedDate)
          end = endOfMonth(selectedDate)
          break
      }

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
  }, [viewMode, selectedDate, paymentSchedule])

  useEffect(() => {
    loadRecentTimesheets()
  }, [loadRecentTimesheets])

  const getFilteredTimesheets = (status: string) => {
    if (status === "all") return timesheets
    
    return timesheets.filter(timesheet => {
      const approvalStatus = timesheet.supervisor_approval || "new"
      return approvalStatus === status
    })
  }

  const getStatusCount = (status: string) => {
    return getFilteredTimesheets(status).length
  }

  const TimesheetList = ({ timesheets, error }: { timesheets: TimesheetWithDetails[], error: string | null }) => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-destructive">
          <p className="font-medium">Failed to load timesheets</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      )
    }

    if (timesheets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="font-medium">No timesheets found</p>
          <p className="text-sm mt-1">No timesheets match the selected filter</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {timesheets.map((timesheet) => (
          <div 
            key={timesheet.id} 
            className="group flex items-center justify-between rounded-lg border p-3 transition-all hover:border-border/80"
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
                  "text-xs",
                  timesheet.supervisor_approval === "approved" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  timesheet.supervisor_approval === "pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  timesheet.supervisor_approval === "rejected" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                )}
              >
                {timesheet.supervisor_approval.charAt(0).toUpperCase() + timesheet.supervisor_approval.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
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
    <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="font-medium">All Timesheets</CardTitle>
        </div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-1 bg-background rounded p-1">
            <button
              onClick={() => setSelectedTab("all")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "all" 
                  ? "bg-sidebar text-foreground" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              All ({timesheets.length})
            </button>
            <button
              onClick={() => setSelectedTab("new")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "new" 
                  ? "bg-sidebar text-foreground" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              New ({getStatusCount("new")})
            </button>
            <button
              onClick={() => setSelectedTab("pending")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "pending" 
                  ? "bg-sidebar text-foreground" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              Pending ({getStatusCount("pending")})
            </button>
            <button
              onClick={() => setSelectedTab("approved")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "approved" 
                  ? "bg-sidebar text-foreground" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              Approved ({getStatusCount("approved")})
            </button>
            <button
              onClick={() => setSelectedTab("rejected")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "rejected" 
                  ? "bg-sidebar text-foreground" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              Rejected ({getStatusCount("rejected")})
            </button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {selectedTab === "all" && (
          <TimesheetList timesheets={getFilteredTimesheets("all")} error={error} />
        )}
        {selectedTab === "new" && (
          <TimesheetList timesheets={getFilteredTimesheets("new")} error={error} />
        )}
        {selectedTab === "pending" && (
          <TimesheetList timesheets={getFilteredTimesheets("pending")} error={error} />
        )}
        {selectedTab === "approved" && (
          <TimesheetList timesheets={getFilteredTimesheets("approved")} error={error} />
        )}
        {selectedTab === "rejected" && (
          <TimesheetList timesheets={getFilteredTimesheets("rejected")} error={error} />
        )}
      </CardHeader>
    </Card>
  )
}
