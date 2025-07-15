"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useDateRange } from "@/context/date-range-context"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, TrendingDown } from "lucide-react"
import { getTimeLogs, type TimeLogsData } from "@/lib/data/time-logs"
import { toast } from "sonner"
import { User } from "@supabase/supabase-js"

interface TimeLogsPageProps {
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  user: User
}

// Loading Skeleton Component
const TimeLogsSkeleton = () => {
  return (
    <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        {/* Header Skeleton */}
        <div>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4"></div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Worker Details Section Skeleton */}
        <div className="mt-6">
          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4"></div>
          
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="group rounded-lg border p-4 transition-all hover:border-border/80 bg-sidebar relative"
              >
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-red-500 rounded-l-lg"></div>
                
                {/* Three Column Layout */}
                <div className="flex items-center">
                  {/* Worker Name Column */}
                  <div className="flex items-center gap-3 w-60 mb-8">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                  
                  {/* Approved Time Column */}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="text-left flex-1">
                        <div className="h-3 w-24 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="text-left w-20">
                        <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="text-left flex-1">
                        <div className="h-3 w-28 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unapproved Time Column */}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="h-4 w-52 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="text-left flex-1">
                        <div className="h-3 w-24 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="text-left w-20">
                        <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="text-left flex-1">
                        <div className="h-3 w-28 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimeLogsPage({ user }: TimeLogsPageProps) {
  const { dateRange } = useDateRange()
  const [timeLogsData, setTimeLogsData] = useState<TimeLogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load time logs data
  const loadTimeLogs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getTimeLogs(
        user.id,
        dateRange?.from,
        dateRange?.to
      )
      
      if (result.success && result.data) {
        setTimeLogsData(result.data)
      } else {
        setError(result.error || "Failed to load time logs")
        toast.error("Failed to load time logs")
      }
    } catch (error) {
      console.error("Error loading time logs:", error)
      setError("Failed to load time logs")
      toast.error("Failed to load time logs")
    } finally {
      setLoading(false)
    }
  }

  // Load data when component mounts or date range changes
  useEffect(() => {
    loadTimeLogs()
  }, [user.id, dateRange?.from, dateRange?.to])

  if (loading) {
    return <TimeLogsSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
        <div>
          <h2 className="text-lg font-medium mb-4">
            Logged Time{" "}
            <span className="text-gray-500 font-normal">
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                </>
              ) : (
                format(new Date(), "MMM dd")
              )}
            </span>
          </h2>
        </div>
        
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-red-600 mb-2">Error loading time logs</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={loadTimeLogs}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!timeLogsData) {
    return (
      <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
        <div>
          <h2 className="text-lg font-medium mb-4">
            Logged Time{" "}
            <span className="text-gray-500 font-normal">
              {dateRange?.from && dateRange?.to ? (
                <>
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                </>
              ) : (
                format(new Date(), "MMM dd")
              )}
            </span>
          </h2>
        </div>
        
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              No time logs data available
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, workers } = timeLogsData

  return (
    <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
      <div>
        <h2 className="text-lg font-medium mb-4">
          Logged Time{" "}
          <span className="text-gray-500 font-normal">
            {dateRange?.from && dateRange?.to ? (
              <>
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              </>
            ) : (
              format(new Date(), "MMM dd")
            )}
          </span>
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Regular Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.regularHours} hours</p>
              <div className="flex items-center gap-1">
                {stats.regularHoursChange >= 0 ? (
                  <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                )}
                <span className={`text-sm font-medium ${
                  stats.regularHoursChange >= 0 
                    ? "text-green-600 dark:text-green-600" 
                    : "text-red-600 dark:text-red-600"
                }`}>
                  {stats.regularHoursChange >= 0 ? "+" : ""}{stats.regularHoursChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Overtime Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.overtimeHours} hours</p>
              <div className="flex items-center gap-1">
                {stats.overtimeHoursChange >= 0 ? (
                  <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                )}
                <span className={`text-sm font-medium ${
                  stats.overtimeHoursChange >= 0 
                    ? "text-green-600 dark:text-green-600" 
                    : "text-red-600 dark:text-red-600"
                }`}>
                  {stats.overtimeHoursChange >= 0 ? "+" : ""}{stats.overtimeHoursChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.totalHours} hours</p>
              <div className="flex items-center gap-1">
                {stats.totalHoursChange >= 0 ? (
                  <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                )}
                <span className={`text-sm font-medium ${
                  stats.totalHoursChange >= 0 
                    ? "text-green-600 dark:text-green-600" 
                    : "text-red-600 dark:text-red-600"
                }`}>
                  {stats.totalHoursChange >= 0 ? "+" : ""}{stats.totalHoursChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Pay</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">${stats.totalPaid.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                {stats.totalPaidChange >= 0 ? (
                  <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                ) : (
                  <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                )}
                <span className={`text-sm font-medium ${
                  stats.totalPaidChange >= 0 
                    ? "text-green-600 dark:text-green-600" 
                    : "text-red-600 dark:text-red-600"
                }`}>
                  {stats.totalPaidChange >= 0 ? "+" : ""}{stats.totalPaidChange}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worker Details Section */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-900 mb-4">Worker Details</h3>
        
        {workers.length === 0 ? (
          <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                No worker time logs found for the selected period
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {workers.map((worker) => (
              <div 
                key={worker.id} 
                className="group rounded-lg border p-4 transition-all hover:border-border/80 bg-sidebar relative"
              >
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-red-500 rounded-l-lg"></div>
                {/* Three Column Layout */}
                <div className="flex items-center">
                  {/* Worker Name Column */}
                  <div className="flex items-center gap-3 w-60 mb-8">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src="/placeholder.svg"
                        alt={worker.name}
                      />
                      <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm font-medium">
                        {worker.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground mb-1">{worker.name}</p>
                      <p className="text-xs font-semibold text-gray-500">{worker.position || "Construction Worker"}</p>
                    </div>
                  </div>
                  
                  {/* Approved Time Column */}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium">Approved time totals by type for period</p>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="text-left flex-1">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Regular Work Hours</p>
                        <p className="text-sm font-medium">{worker.approved.regularHours} hrs</p>
                      </div>
                      <div className="text-left w-20">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Over Time</p>
                        <p className="text-sm font-medium">{worker.approved.overtimeHours} hrs</p>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Total Work Hours</p>
                        <p className="text-sm font-medium">{worker.approved.totalHours} hrs</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unapproved Time Column */}
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm font-medium">Unapproved time totals by type for period</p>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="text-left flex-1">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Regular Work Hours</p>
                        <p className="text-sm font-medium">{worker.unapproved.regularHours} hrs</p>
                      </div>
                      <div className="text-left w-20">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Over Time</p>
                        <p className="text-sm font-medium">{worker.unapproved.overtimeHours} hrs</p>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-xs text-gray-400 uppercase mb-1">Total Work Hours</p>
                        <p className="text-sm font-medium">{worker.unapproved.totalHours} hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 