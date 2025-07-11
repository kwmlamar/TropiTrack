"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

type ViewMode = "daily" | "weekly" | "monthly"

interface UpcomingDeadlinesProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function UpcomingDeadlines({ viewMode, selectedDate }: UpcomingDeadlinesProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeadlines()
  }, [viewMode, selectedDate])

  const loadDeadlines = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading deadlines:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
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
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Important dates and reminders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on bringing you important deadlines and reminders.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
