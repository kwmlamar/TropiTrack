"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"

type ProjectStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

interface ProjectHeaderProps {
  project: {
    id: string
    name: string
    status: ProjectStatus
    start_date?: string | null
    end_date?: string | null
    estimated_end_date?: string | null
    location?: string | null
    client?: {
      name: string
      company?: string | null
    } | null
  }
  progress: number
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  not_started: {
    label: "Planned",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
  in_progress: {
    label: "Active",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  },
  paused: {
    label: "Delayed",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  },
}

export function ProjectHeader({ project, progress }: ProjectHeaderProps) {
  const status = statusConfig[project.status] || statusConfig.not_started

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), "MMM d, yyyy")
    } catch {
      return null
    }
  }

  const startDate = formatDate(project.start_date)
  const endDate = formatDate(project.end_date || project.estimated_end_date)

  const getProgressColor = () => {
    if (project.status === 'completed') return "bg-green-500"
    if (project.status === 'paused') return "bg-amber-500"
    if (project.status === 'cancelled') return "bg-gray-400"
    return "bg-[#2596be]"
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 overflow-hidden">
      <CardContent className="p-6">
        {/* Top row: Name and Status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#2596be]/10 rounded-lg shrink-0">
              <Building2 className="h-6 w-6 text-[#2596be]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              {project.client && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {project.client.company || project.client.name}
                </p>
              )}
            </div>
          </div>
          <Badge className={`${status.className} text-sm font-medium px-3 py-1 shrink-0`}>
            {status.label}
          </Badge>
        </div>

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          {(startDate || endDate) && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {startDate && endDate
                  ? `${startDate} → ${endDate}`
                  : startDate || endDate
                }
              </span>
            </div>
          )}
          {project.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{project.location}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ease-out ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
