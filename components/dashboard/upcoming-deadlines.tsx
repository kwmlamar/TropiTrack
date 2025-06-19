"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

interface UpcomingDeadlinesProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function UpcomingDeadlines({ viewMode, selectedDate, isLoading }: UpcomingDeadlinesProps) {
  

  useEffect(() => {
    if (!isLoading) {
      loadDeadlines()
    }
  }, [viewMode, selectedDate, isLoading])

  const loadDeadlines = async () => {
    try {
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading deadlines:", error)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
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
