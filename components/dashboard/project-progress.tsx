"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase } from "lucide-react"

export function ProjectProgress() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Track your project milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on bringing you real-time project progress tracking.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
