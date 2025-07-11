"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

type ViewMode = "daily" | "weekly" | "monthly"

interface RecentActivityProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function RecentActivity({ viewMode, selectedDate }: RecentActivityProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [viewMode, selectedDate])

  const loadActivities = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
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
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on bringing you real-time activity updates.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
