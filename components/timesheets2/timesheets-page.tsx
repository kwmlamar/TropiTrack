"use client"

import { useState, useMemo, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { CalendarDays, Clock, Users, Building2, Download, Plus, Search, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Updated imports
import {
  getTimesheets,
  updateTimesheet as updateTimesheetData,
  deleteTimesheet,
  getTimesheetSummary,
} from "@/lib/data/timesheets"
import type { TimesheetFilters, TimesheetWithDetails } from "@/lib/types"
import { TimesheetDialog, BulkTimesheetDialog } from "@/components/forms/form-dialogs"
import { fetchProjectsForCompany, fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

type AttendanceStatus = "present" | "absent" | "late"

export default function TimesheetsPage({user}: {user: User}) {
  // Updated state to use TimesheetWithDetails
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({
    totalHours: 0,
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    totalPay: 0,
    timesheetCount: 0,
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWorker, setSelectedWorker] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly")
  const [searchTerm, setSearchTerm] = useState("")

  // Load timesheets effect
  useEffect(() => {
    loadTimesheets();
    loadWorkers();
    loadProjects();
  }, [selectedDate, selectedWorker, selectedProject, viewMode])

  // CRUD operations
  const loadTimesheets = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters: TimesheetFilters = {}

      // Apply date filters based on view mode
      if (viewMode === "daily") {
        filters.date_from = format(selectedDate, "yyyy-MM-dd")
        filters.date_to = format(selectedDate, "yyyy-MM-dd")
      } else {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        filters.date_from = format(weekStart, "yyyy-MM-dd")
        filters.date_to = format(weekEnd, "yyyy-MM-dd")
      }

      // Apply other filters
      if (selectedWorker !== "all") {
        filters.worker_id = selectedWorker
      }

      if (selectedProject !== "all") {
        filters.project_id = selectedProject
      }
      const [timesheetsResult, summaryResult] = await Promise.all([
        getTimesheets(user.id, filters),
        getTimesheetSummary(user.id, filters),
      ])

      if (timesheetsResult.success && timesheetsResult.data) {
        setTimesheets(timesheetsResult.data)
      } else {
        setError(timesheetsResult.error || "Failed to load timesheets")
      }

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadWorkers = async () => {
      setLoading(true)
      try {
        const data = await fetchWorkersForCompany({ user })
        setWorkers(data)
      } catch (error) {
        console.log("Failed to fetch Workers:", error)
      } finally {
        setLoading(false)
      }
    }

  const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await fetchProjectsForCompany({ user });
        setProjects(data);
      } catch (error) {
        console.log("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

  // Updated to work with TimesheetWithDetails
  const handleUpdateTimesheet = async (id: string, field: keyof TimesheetWithDetails, value: any) => {
    try {
      // Only update fields that exist on the base Timesheet type
      const validFields = [
        "date",
        "worker_id",
        "project_id",
        "task_description",
        "clock_in",
        "clock_out",
        "break_duration",
        "regular_hours",
        "overtime_hours",
        "total_hours",
        "hourly_rate",
        "total_pay",
        "supervisor_approval",
        "notes",
      ]

      if (!validFields.includes(field)) {
        console.warn(`Field ${field} is not updatable`)
        return
      }

      const result = await updateTimesheetData({ id, [field]: value })

      if (result.success && result.data) {
        // Update local state - merge the updated data with existing nested data
        setTimesheets((prev) =>
          prev.map((ts) => {
            if (ts.id === id) {
              return {
                ...ts,
                ...result.data,
                // Preserve nested worker and project data
                worker: ts.worker,
                project: ts.project,
              }
            }
            return ts
          }),
        )

        // Reload summary if it's a field that affects calculations
        const calculationFields = ["clock_in", "clock_out", "break_duration", "hourly_rate"]
        if (calculationFields.includes(field)) {
          loadTimesheets() // Reload to get updated calculations
        }
      } else {
        setError(result.error || "Failed to update timesheet")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update timesheet")
    }
  }

  const handleDeleteTimesheet = async (id: string) => {
    try {
      const result = await deleteTimesheet(id)

      if (result.success) {
        setTimesheets((prev) => prev.filter((ts) => ts.id !== id))
        loadTimesheets() // Reload to update summary
      } else {
        setError(result.error || "Failed to delete timesheet")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete timesheet")
    }
  }

  // Helper function to get attendance status from timesheet data
  const getAttendanceStatus = (timesheet: TimesheetWithDetails): AttendanceStatus => {
    if (timesheet.total_hours === 0) return "absent"
    if (timesheet.notes?.toLowerCase().includes("late")) return "late"
    return "present"
  }

  // Filter timesheets based on selected filters
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      const timesheetDate = parseISO(timesheet.date)

      // Date filter
      let dateMatch = false
      if (viewMode === "daily") {
        dateMatch = format(timesheetDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      } else {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
        dateMatch = isWithinInterval(timesheetDate, { start: weekStart, end: weekEnd })
      }

      // Worker filter
      const workerMatch = selectedWorker === "all" || timesheet.worker_id === selectedWorker

      // Project filter
      const projectMatch = selectedProject === "all" || timesheet.project_id === selectedProject

      // Search filter
      const searchMatch =
        searchTerm === "" ||
        timesheet.worker?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.project?.name.toLowerCase().includes(searchTerm.toLowerCase())

      return dateMatch && workerMatch && projectMatch && searchMatch
    })
  }, [timesheets, selectedDate, selectedWorker, selectedProject, viewMode, searchTerm])

  // Calculate weekly summaries using TimesheetWithDetails
  const weeklySummaries = useMemo(() => {
    const summaries = new Map()

    filteredTimesheets.forEach((timesheet) => {
      const key = timesheet.worker_id
      if (!summaries.has(key)) {
        summaries.set(key, {
          worker: timesheet.worker || { id: timesheet.worker_id, name: "Unknown Worker" },
          totalHours: 0,
          overtimeHours: 0,
          daysWorked: 0,
          daysAbsent: 0,
          daysLate: 0,
        })
      }

      const summary = summaries.get(key)
      summary.totalHours += timesheet.total_hours
      summary.overtimeHours += timesheet.overtime_hours

      const status = getAttendanceStatus(timesheet)
      if (status === "present" || status === "late") {
        summary.daysWorked += 1
      }
      if (status === "absent") {
        summary.daysAbsent += 1
      }
      if (status === "late") {
        summary.daysLate += 1
      }
    })

    return Array.from(summaries.values())
  }, [filteredTimesheets])

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants = {
      present: "default",
      absent: "destructive",
      late: "secondary",
    } as const

    const labels = {
      present: "Present",
      absent: "Absent",
      late: "Late",
    }

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    )
  }

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [selectedDate])

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading timesheets...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadTimesheets} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">Track worker hours and manage attendance for construction projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <TimesheetDialog
                userId={user.id}
                workers={workers}
                projects={projects}
                onSuccess={loadTimesheets}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Clock className="h-4 w-4 mr-2" />
                    Single Timesheet
                  </DropdownMenuItem>
                }
              />
              <BulkTimesheetDialog
                userId={user.id}
                workers={workers}
                projects={projects}
                onSuccess={loadTimesheets}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UsersRound className="h-4 w-4 mr-2" />
                    Bulk Entry
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklySummaries.length}</div>
            <p className="text-xs text-muted-foreground">Active this {viewMode === "daily" ? "day" : "week"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegularHours}</div>
            <p className="text-xs text-muted-foreground">Regular hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOvertimeHours}</div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filteredTimesheets.map((ts) => ts.project_id)).size}</div>
            <p className="text-xs text-muted-foreground">Projects with activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>View Mode</Label>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "weekly")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Worker</Label>
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

            <div className="space-y-2">
              <Label>Project</Label>
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

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers or projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {viewMode === "daily" ? "Daily" : "Weekly"} Timesheet - {format(selectedDate, "PPP")}
          </CardTitle>
          <CardDescription>
            {viewMode === "weekly" &&
              `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Worker</th>
                  <th className="text-left p-2 font-medium">Project</th>
                  {viewMode === "weekly" ? (
                    weekDays.map((day) => (
                      <th key={day.toISOString()} className="text-center p-2 font-medium min-w-[100px]">
                        <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                        <div>{format(day, "MMM d")}</div>
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="text-center p-2 font-medium">Hours</th>
                      <th className="text-center p-2 font-medium">Overtime</th>
                      <th className="text-center p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Notes</th>
                    </>
                  )}
                  {viewMode === "weekly" && <th className="text-center p-2 font-medium">Total</th>}
                </tr>
              </thead>
              <tbody>
                {viewMode === "weekly"
                  ? // Weekly view - group by worker
                    weeklySummaries.map((summary) => (
                      <tr key={summary.worker.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{summary.worker.name}</div>
                          <div className="text-sm text-muted-foreground">{summary.worker.role || "Worker"}</div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {Array.from(
                              new Set(
                                filteredTimesheets
                                  .filter((ts) => ts.worker_id === summary.worker.id)
                                  .map((ts) => ts.project?.name || "Unknown Project"),
                              ),
                            ).join(", ")}
                          </div>
                        </td>
                        {weekDays.map((day) => {
                          const dayTimesheet = filteredTimesheets.find(
                            (ts) =>
                              ts.worker_id === summary.worker.id &&
                              format(parseISO(ts.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
                          )
                          return (
                            <td key={day.toISOString()} className="p-2 text-center">
                              {dayTimesheet ? (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    value={dayTimesheet.total_hours}
                                    onChange={(e) =>
                                      handleUpdateTimesheet(
                                        dayTimesheet.id,
                                        "total_hours",
                                        Number.parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-16 h-8 text-center text-sm"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                  />
                                  {getStatusBadge(getAttendanceStatus(dayTimesheet))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="p-2 text-center font-medium">
                          {summary.totalHours}h
                          {summary.overtimeHours > 0 && (
                            <div className="text-xs text-orange-600">+{summary.overtimeHours}h OT</div>
                          )}
                        </td>
                      </tr>
                    ))
                  : // Daily view
                    filteredTimesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{timesheet.worker?.name || "Unknown Worker"}</div>
                          <div className="text-sm text-muted-foreground">{timesheet.worker?.role || "Worker"}</div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{timesheet.project?.name || "Unknown Project"}</div>
                          <div className="text-sm text-muted-foreground">
                            {timesheet.project?.location || "Location TBD"}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            type="number"
                            value={timesheet.total_hours}
                            onChange={(e) =>
                              handleUpdateTimesheet(timesheet.id, "total_hours", Number.parseFloat(e.target.value) || 0)
                            }
                            className="w-20 h-8 text-center"
                            step="0.5"
                            min="0"
                            max="24"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            type="number"
                            value={timesheet.overtime_hours}
                            onChange={(e) =>
                              handleUpdateTimesheet(
                                timesheet.id,
                                "overtime_hours",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20 h-8 text-center"
                            step="0.5"
                            min="0"
                            max="12"
                          />
                        </td>
                        <td className="p-2 text-center">{getStatusBadge(getAttendanceStatus(timesheet))}</td>
                        <td className="p-2">
                          <Input
                            value={timesheet.notes || ""}
                            onChange={(e) => handleUpdateTimesheet(timesheet.id, "notes", e.target.value)}
                            placeholder="Add notes..."
                            className="h-8 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {viewMode === "weekly" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklySummaries.map((summary) => (
                <Card key={summary.worker.id} className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">{summary.worker.name}</div>
                    <div className="text-sm text-muted-foreground">{summary.worker.role || "Worker"}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        Total Hours: <span className="font-medium">{summary.totalHours}h</span>
                      </div>
                      <div>
                        Overtime: <span className="font-medium">{summary.overtimeHours}h</span>
                      </div>
                      <div>
                        Days Worked: <span className="font-medium">{summary.daysWorked}</span>
                      </div>
                      <div>
                        Days Late: <span className="font-medium text-orange-600">{summary.daysLate}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      Estimated Pay:{" "}
                      <span className="font-medium text-green-600">
                        $
                        {(
                          summary.totalHours * (summary.worker.hourlyRate || 20) +
                          summary.overtimeHours * (summary.worker.hourlyRate || 20) * 1.5
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
