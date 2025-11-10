"use client"

import { useState, useMemo } from "react"
import { useTheme } from "next-themes"
import { Calendar as CalendarIcon, Users, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

interface TimesheetSelectionSectionProps {
  projects: Project[]
  workers: Worker[]
  selectedProject: string
  selectedDates: Date[]
  selectedWorkers: Set<string>
  onToggleWorker: (workerId: string) => void
  onSelectAllWorkers: () => void
  onClearWorkers: () => void
  onProjectChange: (projectId: string) => void
  onDatesChange: (dates: Date[]) => void
}

export function TimesheetSelectionSection({
  projects,
  workers,
  selectedProject,
  selectedDates,
  selectedWorkers,
  onToggleWorker,
  onSelectAllWorkers,
  onClearWorkers,
  onProjectChange,
  onDatesChange,
}: TimesheetSelectionSectionProps) {
  const { theme } = useTheme()
  const [projectSelectOpen, setProjectSelectOpen] = useState(false)
  const [dateSelectOpen, setDateSelectOpen] = useState(false)
  const [workerSelectOpen, setWorkerSelectOpen] = useState(false)
  
  // Get button text color based on theme
  const buttonTextColor = useMemo(() => 
    theme === 'dark' ? '#e5e7eb' : '#1f2937'
  , [theme])

  return (
    <div className="w-full border-b backdrop-blur-sm border-slate-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="pl-6 pr-6 pt-2 pb-3 md:px-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          
          {/* Project Selection */}
          <div className="space-y-2">
            <Popover open={projectSelectOpen} onOpenChange={setProjectSelectOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left font-semibold text-base hover:bg-transparent"
                  style={{ color: buttonTextColor }}
                >
                  <div className={`rounded p-1 mr-2 flex-shrink-0 ${
                    selectedProject 
                      ? "bg-primary" 
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}>
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="truncate max-w-[150px]">
                    {projects.find(p => p.id === selectedProject)?.name || "Project"}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup>
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.id}
                        onSelect={() => {
                          onProjectChange(project.id)
                          setProjectSelectOpen(false)
                        }}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Popover open={dateSelectOpen} onOpenChange={setDateSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-semibold text-base hover:bg-transparent"
                  style={{ color: buttonTextColor }}
                >
                  <div className={`rounded p-1 mr-2 flex-shrink-0 ${
                    selectedDates.length > 0
                      ? "bg-primary" 
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}>
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="truncate max-w-[150px]">
                    Dates {selectedDates.length > 0 ? `(${selectedDates.length})` : ''}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Select Dates</h4>
                    {selectedDates.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDatesChange([])}
                        className="h-7 text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      if (dates) {
                        onDatesChange(Array.isArray(dates) ? dates : [dates])
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Worker Selection */}
          <div className="space-y-2">
            <Popover open={workerSelectOpen} onOpenChange={setWorkerSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left font-semibold text-base hover:bg-transparent"
                  style={{ color: buttonTextColor }}
                >
                  <div className="bg-gray-300 dark:bg-gray-700 rounded p-1 mr-2 flex-shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="truncate max-w-[150px]">
                    Workers
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <div className="p-2 border-b dark:border-neutral-700">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          onSelectAllWorkers()
                        }}
                        className="flex-1"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          onClearWorkers()
                        }}
                        className="flex-1"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <CommandEmpty>No workers found.</CommandEmpty>
                  <CommandGroup>
                    {workers.map((worker) => (
                      <CommandItem
                        key={worker.id}
                        value={worker.id}
                        onSelect={() => {
                          // Prevent dropdown from closing on select
                        }}
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          onToggleWorker(worker.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onToggleWorker(worker.id)
                            setWorkerSelectOpen(false)
                          }
                        }}
                      >
                        <Checkbox
                          checked={selectedWorkers.has(worker.id)}
                          onCheckedChange={() => {
                            onToggleWorker(worker.id)
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{worker.name}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary */}
      </div>
    </div>
  )
}
