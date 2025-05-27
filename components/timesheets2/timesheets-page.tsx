"use client"

import { useState, useMemo } from "react"
import { CalendarDays, Clock, Users, Building2, Download, Plus, Search } from "lucide-react"
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

// Mock data - replace with real data from your backend
const mockWorkers = [
  { id: "1", name: "Marcus Johnson", role: "Foreman", hourlyRate: 25 },
  { id: "2", name: "David Williams", role: "Carpenter", hourlyRate: 22 },
  { id: "3", name: "James Brown", role: "Electrician", hourlyRate: 28 },
  { id: "4", name: "Robert Davis", role: "Plumber", hourlyRate: 26 },
  { id: "5", name: "Michael Wilson", role: "Laborer", hourlyRate: 18 },
  { id: "6", name: "Christopher Moore", role: "Mason", hourlyRate: 24 },
]

const mockProjects = [
  { id: "1", name: "Paradise Resort Phase 1", location: "Nassau" },
  { id: "2", name: "Cable Beach Condos", location: "Cable Beach" },
  { id: "3", name: "Downtown Office Complex", location: "Nassau" },
  { id: "4", name: "Atlantis Expansion", location: "Paradise Island" },
]

const mockTimesheets = [
  {
    id: "1",
    workerId: "1",
    projectId: "1",
    date: "2024-01-15",
    hoursWorked: 8,
    overtimeHours: 0,
    status: "present",
    notes: "Regular shift",
  },
  {
    id: "2",
    workerId: "1",
    projectId: "1",
    date: "2024-01-16",
    hoursWorked: 9,
    overtimeHours: 1,
    status: "present",
    notes: "Extra hour for deadline",
  },
  {
    id: "3",
    workerId: "2",
    projectId: "2",
    date: "2024-01-15",
    hoursWorked: 7.5,
    overtimeHours: 0,
    status: "present",
    notes: "",
  },
  {
    id: "4",
    workerId: "2",
    projectId: "2",
    date: "2024-01-16",
    hoursWorked: 0,
    overtimeHours: 0,
    status: "absent",
    notes: "Sick leave",
  },
  {
    id: "5",
    workerId: "3",
    projectId: "1",
    date: "2024-01-15",
    hoursWorked: 8,
    overtimeHours: 0,
    status: "late",
    notes: "Arrived 30 min late",
  },
  {
    id: "6",
    workerId: "3",
    projectId: "1",
    date: "2024-01-16",
    hoursWorked: 8,
    overtimeHours: 0,
    status: "present",
    notes: "",
  },
]

type AttendanceStatus = "present" | "absent" | "late"

interface Timesheet {
  id: string
  workerId: string
  projectId: string
  date: string
  hoursWorked: number
  overtimeHours: number
  status: AttendanceStatus
  notes: string
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(mockTimesheets)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWorker, setSelectedWorker] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter timesheets based on selected filters
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      const timesheetDate = parseISO(timesheet.date)
      const worker = mockWorkers.find((w) => w.id === timesheet.workerId)
      const project = mockProjects.find((p) => p.id === timesheet.projectId)

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
      const workerMatch = selectedWorker === "all" || timesheet.workerId === selectedWorker

      // Project filter
      const projectMatch = selectedProject === "all" || timesheet.projectId === selectedProject

      // Search filter
      const searchMatch =
        searchTerm === "" ||
        worker?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project?.name.toLowerCase().includes(searchTerm.toLowerCase())

      return dateMatch && workerMatch && projectMatch && searchMatch
    })
  }, [timesheets, selectedDate, selectedWorker, selectedProject, viewMode, searchTerm])

  // Calculate weekly summaries
  const weeklySummaries = useMemo(() => {
    const summaries = new Map()

    filteredTimesheets.forEach((timesheet) => {
      const key = timesheet.workerId
      if (!summaries.has(key)) {
        const worker = mockWorkers.find((w) => w.id === timesheet.workerId)
        summaries.set(key, {
          worker,
          totalHours: 0,
          overtimeHours: 0,
          daysWorked: 0,
          daysAbsent: 0,
          daysLate: 0,
        })
      }

      const summary = summaries.get(key)
      summary.totalHours += timesheet.hoursWorked
      summary.overtimeHours += timesheet.overtimeHours

      if (timesheet.status === "present" || timesheet.status === "late") {
        summary.daysWorked += 1
      }
      if (timesheet.status === "absent") {
        summary.daysAbsent += 1
      }
      if (timesheet.status === "late") {
        summary.daysLate += 1
      }
    })

    return Array.from(summaries.values())
  }, [filteredTimesheets])

  const updateTimesheet = (id: string, field: keyof Timesheet, value: any) => {
    setTimesheets((prev) => prev.map((ts) => (ts.id === id ? { ...ts, [field]: value } : ts)))
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Timesheets</h1>
          <p className="text-muted-foreground">Track worker hours and manage attendance for construction projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
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
            <div className="text-2xl font-bold">{weeklySummaries.reduce((sum, s) => sum + s.totalHours, 0)}</div>
            <p className="text-xs text-muted-foreground">Regular hours worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklySummaries.reduce((sum, s) => sum + s.overtimeHours, 0)}</div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filteredTimesheets.map((ts) => ts.projectId)).size}</div>
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
                  {mockWorkers.map((worker) => (
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
                  {mockProjects.map((project) => (
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
                          <div className="text-sm text-muted-foreground">{summary.worker.role}</div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {Array.from(
                              new Set(
                                filteredTimesheets
                                  .filter((ts) => ts.workerId === summary.worker.id)
                                  .map((ts) => mockProjects.find((p) => p.id === ts.projectId)?.name),
                              ),
                            ).join(", ")}
                          </div>
                        </td>
                        {weekDays.map((day) => {
                          const dayTimesheet = filteredTimesheets.find(
                            (ts) =>
                              ts.workerId === summary.worker.id &&
                              format(parseISO(ts.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
                          )
                          return (
                            <td key={day.toISOString()} className="p-2 text-center">
                              {dayTimesheet ? (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    value={dayTimesheet.hoursWorked}
                                    onChange={(e) =>
                                      updateTimesheet(
                                        dayTimesheet.id,
                                        "hoursWorked",
                                        Number.parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-16 h-8 text-center text-sm"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                  />
                                  {getStatusBadge(dayTimesheet.status)}
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
                    filteredTimesheets.map((timesheet) => {
                      const worker = mockWorkers.find((w) => w.id === timesheet.workerId)
                      const project = mockProjects.find((p) => p.id === timesheet.projectId)
                      return (
                        <tr key={timesheet.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="font-medium">{worker?.name}</div>
                            <div className="text-sm text-muted-foreground">{worker?.role}</div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{project?.name}</div>
                            <div className="text-sm text-muted-foreground">{project?.location}</div>
                          </td>
                          <td className="p-2 text-center">
                            <Input
                              type="number"
                              value={timesheet.hoursWorked}
                              onChange={(e) =>
                                updateTimesheet(timesheet.id, "hoursWorked", Number.parseFloat(e.target.value) || 0)
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
                              value={timesheet.overtimeHours}
                              onChange={(e) =>
                                updateTimesheet(timesheet.id, "overtimeHours", Number.parseFloat(e.target.value) || 0)
                              }
                              className="w-20 h-8 text-center"
                              step="0.5"
                              min="0"
                              max="12"
                            />
                          </td>
                          <td className="p-2 text-center">{getStatusBadge(timesheet.status)}</td>
                          <td className="p-2">
                            <Input
                              value={timesheet.notes}
                              onChange={(e) => updateTimesheet(timesheet.id, "notes", e.target.value)}
                              placeholder="Add notes..."
                              className="h-8 text-sm"
                            />
                          </td>
                        </tr>
                      )
                    })}
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
                    <div className="text-sm text-muted-foreground">{summary.worker.role}</div>
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
                          summary.totalHours * summary.worker.hourlyRate +
                          summary.overtimeHours * summary.worker.hourlyRate * 1.5
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
