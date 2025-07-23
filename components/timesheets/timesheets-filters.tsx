"use client"


import { SlidersHorizontal, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

type ViewMode = "daily" | "weekly"

interface TimesheetsFiltersProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  selectedWorker: string
  setSelectedWorker: (worker: string) => void
  selectedProject: string
  setSelectedProject: (project: string) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  workers: Worker[]
  projects: Project[]
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function TimesheetsFilters({
  selectedDate,
  setSelectedDate,
  selectedWorker,
  setSelectedWorker,
  selectedProject,
  setSelectedProject,
  viewMode,
  setViewMode,
  workers,
  projects,
  weekStartDay = 6,
}: TimesheetsFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(selectedWorker !== "all" || selectedProject !== "all" || viewMode !== "weekly") && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {(selectedWorker !== "all" ? 1 : 0) + (selectedProject !== "all" ? 1 : 0) + (viewMode !== "weekly" ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-80 p-4">
        <DropdownMenuLabel className="text-base font-semibold">
          Filter Timesheets
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* View Mode Filter */}
        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">View Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                viewMode === "daily"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-gray-500 border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Daily
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                viewMode === "weekly"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-gray-500 border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Weekly
            </button>
          </div>
        </div>

        <Separator />

        {/* Date Filter */}
        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarDays className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                weekStartsOn={weekStartDay}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Worker Filter */}
        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Worker</Label>
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workers</SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Project Filter */}
        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Clear Filters */}
        {(selectedWorker !== "all" || selectedProject !== "all" || viewMode !== "weekly") && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedWorker("all");
                setSelectedProject("all");
                setViewMode("weekly");
              }}
              className="w-full justify-start text-gray-500 hover:text-foreground"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 