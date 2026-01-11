"use client"

import { useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Info } from "lucide-react"
import { mockTimelineData, statusColors } from "./mock-data"
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths } from "date-fns"

interface ProjectTimelineProps {
  projectStartDate?: string | null  // Reserved for future use
  projectEndDate?: string | null    // Reserved for future use
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProjectTimeline(props: ProjectTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Calculate timeline range from mock data
  const timelineRange = useMemo(() => {
    const allTasks = mockTimelineData.flatMap(phase => phase.tasks)
    if (allTasks.length === 0) {
      const start = new Date()
      return {
        start: startOfMonth(start),
        end: endOfMonth(addMonths(start, 3)),
        months: eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(addMonths(start, 3)) })
      }
    }

    const dates = allTasks.flatMap(task => [new Date(task.startDate), new Date(task.endDate)])
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    const start = startOfMonth(minDate)
    const end = endOfMonth(maxDate)
    const months = eachMonthOfInterval({ start, end })

    return { start, end, months }
  }, [])

  // Total days for width calculation
  const totalDays = differenceInDays(timelineRange.end, timelineRange.start) + 1
  const dayWidth = 12 // pixels per day

  // Calculate position and width for a task
  const getTaskStyle = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startOffset = differenceInDays(start, timelineRange.start)
    const duration = differenceInDays(end, start) + 1

    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth}px`,
    }
  }

  const getStatusColor = (status: keyof typeof statusColors) => {
    return statusColors[status]?.bar || 'bg-gray-300'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Project Timeline</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal gap-1">
              <Info className="h-3 w-3" />
              Sample Data
            </Badge>
          </div>
          <button className="text-sm text-[#2596be] hover:text-[#1e7a9a] flex items-center gap-1 font-medium transition-colors">
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Timeline container */}
        <div className="relative">
          {/* Month headers - sticky */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4"
          >
            <div style={{ minWidth: `${totalDays * dayWidth + 160}px` }}>
              {/* Month labels */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 ml-[160px]">
                {timelineRange.months.map((month, index) => {
                  const monthDays = differenceInDays(
                    index < timelineRange.months.length - 1
                      ? timelineRange.months[index + 1]
                      : endOfMonth(month),
                    month
                  ) + (index === timelineRange.months.length - 1 ? 1 : 0)

                  return (
                    <div
                      key={month.toISOString()}
                      className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2 border-l border-gray-200 dark:border-gray-700 first:border-l-0 px-2"
                      style={{ width: `${monthDays * dayWidth}px` }}
                    >
                      {format(month, "MMM yyyy")}
                    </div>
                  )
                })}
              </div>

              {/* Phase rows */}
              {mockTimelineData.map((phase) => (
                <div key={phase.id} className="mb-4">
                  {/* Phase header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-[160px] shrink-0">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {phase.name}
                      </span>
                    </div>
                  </div>

                  {/* Task bars */}
                  <div className="relative ml-[160px]" style={{ height: `${phase.tasks.length * 32}px` }}>
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {timelineRange.months.map((month, index) => {
                        const monthDays = differenceInDays(
                          index < timelineRange.months.length - 1
                            ? timelineRange.months[index + 1]
                            : endOfMonth(month),
                          month
                        ) + (index === timelineRange.months.length - 1 ? 1 : 0)

                        return (
                          <div
                            key={month.toISOString()}
                            className="border-l border-gray-100 dark:border-gray-800 first:border-l-0"
                            style={{ width: `${monthDays * dayWidth}px` }}
                          />
                        )
                      })}
                    </div>

                    {/* Task bars */}
                    {phase.tasks.map((task, taskIndex) => {
                      const style = getTaskStyle(task.startDate, task.endDate)
                      return (
                        <div
                          key={task.id}
                          className="absolute group cursor-pointer"
                          style={{
                            ...style,
                            top: `${taskIndex * 32}px`,
                            height: '24px',
                          }}
                        >
                          {/* Task bar */}
                          <div
                            className={`h-full rounded-full ${getStatusColor(task.status)} transition-all duration-200 group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-[#2596be]/30 flex items-center px-2 overflow-hidden`}
                          >
                            <span className="text-xs font-medium text-white truncate">
                              {task.name}
                            </span>
                          </div>

                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                              <p className="font-medium">{task.name}</p>
                              <p className="text-gray-400 mt-1">
                                {format(new Date(task.startDate), "MMM d")} - {format(new Date(task.endDate), "MMM d, yyyy")}
                              </p>
                              <p className="text-gray-400">
                                Progress: {task.progress}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Not Started</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
