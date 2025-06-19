"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

interface RecentActivityProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function RecentActivity({ viewMode, selectedDate, isLoading }: RecentActivityProps) {
  

  useEffect(() => {
    if (!isLoading) {
      loadActivities()
    }
  }, [viewMode, selectedDate, isLoading])

  const loadActivities = async () => {
    try {
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading activities:", error)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
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
