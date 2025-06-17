"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { getProjects } from "@/lib/data/projects"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import type { ProjectWithDetails } from "@/lib/types/project"

export function ProjectProgress() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (!profile) return

        const response = await getProjects(profile.company_id, {
          status: "in_progress",
          limit: 4
        })

        if (response.success && response.data) {
          setProjects(response.data)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const getProjectStatus = (project: ProjectWithDetails) => {
    switch (project.status) {
      case "completed":
        return "On Track"
      case "paused":
      case "cancelled":
        return "Delayed"
      case "in_progress":
        return "On Track"
      default:
        return "Not Started"
    }
  }

  const getProjectProgress = (project: ProjectWithDetails) => {
    // For now, we'll use a simple calculation based on status
    // In a real app, this would be based on completed tasks/milestones
    switch (project.status) {
      case "completed":
        return 100
      case "in_progress":
        return 75
      case "paused":
        return 45
      case "cancelled":
        return 20
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Current status of active projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => {
            const status = getProjectStatus(project)
            const progress = getProjectProgress(project)
            
            return (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{project.name}</p>
                  <span
                    className={`text-xs font-medium ${
                      status === "On Track"
                        ? "text-green-600"
                        : status === "Delayed"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={progress}
                    className={`h-2 ${
                      status === "On Track"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : status === "Delayed"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-gray-100 dark:bg-gray-900/30"
                    }`}
                    indicatorClassName={
                      status === "On Track"
                        ? "bg-green-600 dark:bg-green-400"
                        : status === "Delayed"
                          ? "bg-red-600 dark:bg-red-400"
                          : "bg-gray-600 dark:bg-gray-400"
                    }
                  />
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due: {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "No due date"}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
