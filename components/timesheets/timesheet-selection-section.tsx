"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Calendar, Users, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MultiDatePicker } from "@/components/ui/multi-date-picker"
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
  onProjectChange: (projectId: string) => void
  onDatesChange: (dates: Date[]) => void
  onWorkersChange: (workerIds: Set<string>) => void
}

export function TimesheetSelectionSection({
  projects,
  workers,
  selectedProject,
  selectedDates,
  selectedWorkers,
  onProjectChange,
  onDatesChange,
  onWorkersChange,
}: TimesheetSelectionSectionProps) {
  const { theme } = useTheme()
  const [workerSelectOpen, setWorkerSelectOpen] = useState(false)


  const handleWorkerToggle = (workerId: string) => {
    const newSelectedWorkers = new Set(selectedWorkers)
    if (newSelectedWorkers.has(workerId)) {
      newSelectedWorkers.delete(workerId)
    } else {
      newSelectedWorkers.add(workerId)
    }
    onWorkersChange(newSelectedWorkers)
  }

  const handleSelectAllWorkers = () => {
    const allWorkerIds = new Set(workers.map(w => w.id))
    onWorkersChange(allWorkerIds)
  }

  const handleClearAllWorkers = () => {
    onWorkersChange(new Set())
  }

  return (
    <div 
      className="backdrop-blur-sm shadow-none rounded-none border-l-0 border-r-0 border-t-0 m-0"
      style={{
        backgroundColor: theme === 'dark' ? '#171717' : 'oklch(1 0.003 250)',
        borderBottom: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.5)'
      }}
    >
      <div className="ml-64 mr-64 pt-8 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-0 mr-0">
          {/* Project Selection */}
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full max-w-sm justify-start text-left font-semibold text-lg text-gray-700 hover:bg-transparent">
                  <div className={`rounded p-1 mr-2 ${
                    selectedProject 
                      ? "bg-primary" 
                      : "bg-gray-700"
                  }`}>
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <span>{projects.find(p => p.id === selectedProject)?.name || "Project"}</span>
                  
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
                        }}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full max-w-sm justify-start text-left font-semibold text-lg text-gray-700 hover:bg-transparent"
                >
                  <div className="bg-gray-700 rounded p-1 mr-2">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <span>Dates</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <MultiDatePicker
                  selectedDates={selectedDates}
                  onDatesChange={onDatesChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Worker Selection */}
          <div className="space-y-2">
            <Popover open={workerSelectOpen} onOpenChange={setWorkerSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full max-w-sm justify-start text-left font-semibold text-lg text-gray-700 hover:bg-transparent"
                >
                  <div className="bg-gray-700 rounded p-1 mr-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span>Workers</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <div className="p-2 border-b">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleSelectAllWorkers()
                        }}
                        className="flex-1"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleClearAllWorkers()
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
                          // Prevent dropdown from closing
                        }}
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          handleWorkerToggle(worker.id)
                        }}
                      >
                        <Checkbox
                          checked={selectedWorkers.has(worker.id)}
                          onCheckedChange={() => {
                            handleWorkerToggle(worker.id)
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {worker.position}
                          </div>
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
