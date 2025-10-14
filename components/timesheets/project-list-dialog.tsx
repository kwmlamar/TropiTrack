"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"

interface ProjectListDialogProps {
  projects: string[]
  workerName: string
}

export function ProjectListDialog({ projects, workerName }: ProjectListDialogProps) {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)

  if (projects.length === 0) {
    return <span className="text-sm text-gray-500">No Projects</span>
  }

  if (projects.length === 1) {
    return (
      <div className="text-sm" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
        {projects[0]}
      </div>
    )
  }

  // Multiple projects - show first project with clickable indicator
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left"
        >
          <div className="text-sm" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            {projects[0]}
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs px-1.5 py-0.5 h-5 flex items-center gap-0.5"
            style={{
              backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246)',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            }}
          >
            +{projects.length - 1}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-3"
        align="start"
        style={{
          backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
          borderColor: theme === 'dark' ? '#404040' : 'rgb(229 231 235)',
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
              {workerName}&apos;s Projects
            </p>
            <Badge variant="outline" className="text-xs">
              {projects.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {projects.map((project, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-md transition-colors hover:bg-accent"
                style={{
                  backgroundColor: index === 0 ? (theme === 'dark' ? '#262626' : 'rgb(249 250 251)') : 'transparent',
                }}
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5"
                  style={{
                    backgroundColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 text-sm leading-tight" style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
                  {project}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

