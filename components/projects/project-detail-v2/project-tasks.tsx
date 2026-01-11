"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Info,
  Users
} from "lucide-react"
import { mockPhaseData, statusColors } from "./mock-data"
import { TaskStatus } from "./types"

export function ProjectTasks() {
  const [openPhases, setOpenPhases] = useState<string[]>(
    mockPhaseData.map(phase => phase.id) // All open by default
  )

  const togglePhase = (phaseId: string) => {
    setOpenPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      not_started: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      blocked: 'Blocked'
    }
    return labels[status]
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Tasks & Phases</CardTitle>
          <Badge variant="secondary" className="text-xs font-normal gap-1">
            <Info className="h-3 w-3" />
            Sample Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {mockPhaseData.map((phase) => (
            <Collapsible
              key={phase.id}
              open={openPhases.includes(phase.id)}
              onOpenChange={() => togglePhase(phase.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        openPhases.includes(phase.id) ? '' : '-rotate-90'
                      }`}
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {phase.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({phase.tasks.length} tasks)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">
                          {phase.overallProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-[#2596be] transition-all duration-500"
                          style={{ width: `${phase.overallProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 ml-7 space-y-2">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#2596be]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {task.name}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Assigned Workers */}
                        <div className="flex items-center gap-1.5">
                          {task.assignedWorkers.length > 0 ? (
                            <>
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                                {task.assignedWorkers.length === 1
                                  ? task.assignedWorkers[0].name.split(' ')[0]
                                  : `${task.assignedWorkers.length} workers`
                                }
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Unassigned
                            </span>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                task.percentComplete === 100
                                  ? 'bg-green-500'
                                  : task.percentComplete > 0
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${task.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                            {task.percentComplete}%
                          </span>
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[task.status]?.bg} ${statusColors[task.status]?.text}`}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
