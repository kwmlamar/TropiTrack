"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

type ViewMode = "daily" | "weekly" | "monthly"

interface ProjectProgressProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function ProjectProgress({ viewMode, selectedDate }: ProjectProgressProps) {
  const [loading, setLoading] = useState(true)

  const loadProjectData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // This is mock data for now
      
    } catch (error) {
      console.error("Error loading project data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjectData()
  }, [viewMode, selectedDate])

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
                <div className="h-2 w-full animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
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
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Track your project milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;re working on bringing you real-time project progress tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
