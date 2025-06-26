"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

interface ProjectProgressProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function ProjectProgress({ viewMode, selectedDate, isLoading }: ProjectProgressProps) {
  

  const loadProjectData = async () => {
    try {
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading project data:", error)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      loadProjectData()
    }
  }, [viewMode, selectedDate, isLoading])

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Track your project milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on bringing you real-time project progress tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
