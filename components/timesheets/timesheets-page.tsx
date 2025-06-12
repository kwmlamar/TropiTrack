"use client"

import { useState, useMemo, useEffect } from "react"
import React from "react"
import { User } from "@supabase/supabase-js"
import { CalendarDays, Clock, Users, Building2, Download, Plus, UsersRound, Trash2 } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

import {
  getTimesheets,
  updateTimesheet as updateTimesheetData,
  getTimesheetSummary,
  deleteTimesheet,
} from "@/lib/data/timesheets"
import { generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"
import type { TimesheetFilters, TimesheetWithDetails } from "@/lib/types"
import { TimesheetDialog, BulkTimesheetDialog } from "@/components/forms/form-dialogs"
import { fetchProjectsForCompany, fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

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
  const [searchTerm] = useState("")
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<Set<string>>(new Set())
  const [isApproving, setIsApproving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1) // Default to Monday

  const { paymentSchedule, loading: payrollLoading } = usePayrollSettings()

  // Initialize week start day from payroll settings
  useEffect(() => {
    if (!payrollLoading && paymentSchedule?.period_start_type === "day_of_week") {
      const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
      }
      setWeekStartDay(dayMap[paymentSchedule.period_start_day] || 1)
    }
  }, [paymentSchedule, payrollLoading])

  // Load timesheets effect
  useEffect(() => {
    loadTimesheets();
    loadWorkers();
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedWorker, selectedProject, viewMode, weekStartDay])

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
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay })
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
        const data = await fetchWorkersForCompany(user.id)
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
        const data = await fetchProjectsForCompany(user.id);
        setProjects(data);
      } catch (error) {
        console.log("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

  // Updated to work with TimesheetWithDetails
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay })
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay })
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
  }, [timesheets, selectedDate, selectedWorker, selectedProject, viewMode, searchTerm, weekStartDay])

  const groupedTimesheets = useMemo(() => {
    const grouped = new Map<string, Map<string, TimesheetWithDetails[]>>()

    filteredTimesheets.forEach(timesheet => {
      const workerId = timesheet.worker_id
      const weekStart = format(startOfWeek(parseISO(timesheet.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')

      if (!grouped.has(workerId)) {
        grouped.set(workerId, new Map<string, TimesheetWithDetails[]>())
      }
      const workerWeeks = grouped.get(workerId)!
      if (!workerWeeks.has(weekStart)) {
        workerWeeks.set(weekStart, [])
      }
      workerWeeks.get(weekStart)!.push(timesheet)
    })
    return grouped
  }, [filteredTimesheets, weekStartDay])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredTimesheets.map(ts => ts.id));
      setSelectedTimesheetIds(allIds);
    } else {
      setSelectedTimesheetIds(new Set());
    }
  };

  const handleSelectTimesheet = (id: string, checked: boolean) => {
    setSelectedTimesheetIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAllInWeek = (workerId: string, weekStart: string, checked: boolean) => {
    setSelectedTimesheetIds(prev => {
      const newSet = new Set(prev);
      const workerWeeks = groupedTimesheets.get(workerId);
      if (workerWeeks) {
        const timesheetsInWeek = workerWeeks.get(weekStart);
        if (timesheetsInWeek) {
          timesheetsInWeek.forEach(ts => {
            if (checked) {
              newSet.add(ts.id);
            } else {
              newSet.delete(ts.id);
            }
          });
        }
      }
      return newSet;
    });
  };

  const handleApproveSelected = async () => {
    setIsApproving(true);
    try {
      const updates = Array.from(selectedTimesheetIds).map(id =>
        updateTimesheetData({ id, supervisor_approval: "approved" })
      );
      const results = await Promise.all(updates);

      const failedApprovals = results.filter(result => !result.success);
      if (failedApprovals.length > 0) {
        toast.error("Failed to approve some timesheets", {
          description: `${failedApprovals.length} timesheets could not be approved.`, 
        });
      } else {
        toast.success("Timesheets approved successfully", {
          description: "All selected timesheets have been marked as approved.",
        });

        // After approving, trigger payroll calculation for affected workers/weeks
        const affectedWorkersAndWeeks = new Map<string, { workerId: string, weekStart: string, weekEnd: string }>();
        selectedTimesheetIds.forEach(id => {
          const ts = timesheets.find(t => t.id === id);
          if (ts) {
            const weekStart = format(startOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd');
            const weekEnd = format(endOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd');
            const key = `${ts.worker_id}-${weekStart}`;
            if (!affectedWorkersAndWeeks.has(key)) {
              affectedWorkersAndWeeks.set(key, { workerId: ts.worker_id, weekStart, weekEnd });
            }
          }
        });

        for (const { workerId, weekStart, weekEnd } of affectedWorkersAndWeeks.values()) {
          await generatePayrollForWorkerAndPeriod(user.id, workerId, weekStart, weekEnd);
        }
      }

      setSelectedTimesheetIds(new Set());
      loadTimesheets();
    } catch (error) {
      console.error("Error approving timesheets:", error);
      toast.error("Error approving timesheets", {
        description: "An unexpected error occurred while approving timesheets.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      const deletes = Array.from(selectedTimesheetIds).map(id =>
        deleteTimesheet(id)
      );
      const results = await Promise.all(deletes);

      const failedDeletions = results.filter(result => !result.success);
      if (failedDeletions.length > 0) {
        toast.error("Failed to delete some timesheets", {
          description: `${failedDeletions.length} timesheets could not be deleted.`, 
        });
      } else {
        toast.success("Timesheets deleted successfully", {
          description: "All selected timesheets have been deleted.",
        });
      }

      setSelectedTimesheetIds(new Set());
      loadTimesheets();
    } catch (error) {
      console.error("Error deleting timesheets:", error);
      toast.error("Error deleting timesheets", {
        description: "An unexpected error occurred while deleting timesheets.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [selectedDate, weekStartDay])

  const getWeekStartDayName = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6): string => {
    const dayNames = {
      0: "Sunday",
      1: "Monday", 
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday"
    }
    return dayNames[day]
  }

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
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedTimesheets.size}</div>
            <p className="text-xs text-muted-foreground">Active this {viewMode === "daily" ? "day" : "week"}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegularHours}</div>
            <p className="text-xs text-muted-foreground">Regular hours worked</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOvertimeHours}</div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pay</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalPay}</div>
            <p className="text-xs text-muted-foreground">Estimated pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                    weekStartsOn={weekStartDay}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {viewMode === "weekly" && (
              <div className="space-y-2">
                <Label>Week Starts On</Label>
                <Select 
                  value={weekStartDay.toString()} 
                  onValueChange={(value) => setWeekStartDay(Number(value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select week start" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
                {paymentSchedule?.period_start_type === "day_of_week" && (
                  <p className="text-xs text-muted-foreground">
                    Payroll period starts on {getWeekStartDayName(weekStartDay)}
                  </p>
                )}
              </div>
            )}

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
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <div>
            <CardTitle className="text-lg">
              {viewMode === "daily" ? "Daily" : "Weekly"} Timesheet - {format(selectedDate, "PPP")}
            </CardTitle>
            <CardDescription>
              {viewMode === "weekly" &&
                `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM d, yyyy")}`}
            </CardDescription>
          </div>
          {selectedTimesheetIds.size > 0 && (
            <div className="flex space-x-2">
              <Button
                onClick={handleDeleteSelected}
                disabled={isDeleting || isApproving}
                variant="outline"
                size="sm"
              >
                {isDeleting ? "Deleting..." : (<Trash2 className="h-4 w-4" />)}
              </Button>
              <Button
                onClick={handleApproveSelected}
                disabled={isApproving || isDeleting}
                size="sm"
              >
                {isApproving ? "Approving..." : "Approve Selected"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium w-12">
                    <Checkbox
                      checked={selectedTimesheetIds.size === filteredTimesheets.length && filteredTimesheets.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all timesheets"
                    />
                  </th>
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
                  {viewMode === "weekly" && <th className="text-center p-2 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {viewMode === "weekly"
                  ? // Weekly view - group by worker and week
                    Array.from(groupedTimesheets.entries()).map(([workerId, workerWeeks]) => (
                      <React.Fragment key={workerId}>
                        {Array.from(workerWeeks.entries()).map(([weekStart, timesheetsInWeek]) => {
                          const worker = workers.find(w => w.id === workerId);
                          const isAllInWeekSelected = timesheetsInWeek.length > 0 && timesheetsInWeek.every(ts => selectedTimesheetIds.has(ts.id));
                          const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                          const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                          // Determine if all timesheets in the week are approved
                          const isWeekApproved = timesheetsInWeek.every(ts => ts.supervisor_approval === "approved");

                          return (
                            <tr key={`${workerId}-${weekStart}`} className="border-b hover:bg-muted/50">
                              <td className="p-2 w-12">
                                <Checkbox
                                  checked={isAllInWeekSelected}
                                  onCheckedChange={(checked: boolean) => handleSelectAllInWeek(workerId, weekStart, checked)}
                                  aria-label={`Select all timesheets for ${worker?.name || "Unknown Worker"} in week ${weekStart}`}
                                />
                              </td>
                              <td className="p-2">
                                <div className="font-medium">{worker?.name || "Unknown Worker"}</div>
                                <div className="text-sm text-muted-foreground">{worker?.role || "Worker"}</div>
                              </td>
                              <td className="p-2">
                                <div className="text-sm">
                                  {Array.from(
                                    new Set(
                                      timesheetsInWeek.map((ts) => ts.project?.name || "Unknown Project"),
                                    ),
                                  ).join(", ")}
                                </div>
                              </td>
                              {weekDays.map((day) => {
                                const dayTimesheet = timesheetsInWeek.find(
                                  (ts) => format(parseISO(ts.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
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
                                {weekTotalHours}h
                                {weekOvertimeHours > 0 && (
                                  <div className="text-xs text-orange-600">+{weekOvertimeHours}h OT</div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {isWeekApproved ? (
                                  <Badge className="bg-green-500/10 text-green-700">Approved</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      const updates = timesheetsInWeek.map(ts =>
                                        updateTimesheetData({ id: ts.id, supervisor_approval: "approved" })
                                      );
                                      await Promise.all(updates);
                                      // Trigger payroll generation for this worker and week
                                      const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd');
                                      await generatePayrollForWorkerAndPeriod(user.id, workerId, weekStart, weekEnd);

                                      loadTimesheets();
                                      toast.success("Week approved!", { description: `${worker?.name}'s timesheets for ${weekStart} approved.` });
                                    }}
                                  >
                                    Approve Week
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  :
                    filteredTimesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 w-12">
                          <Checkbox
                            checked={selectedTimesheetIds.has(timesheet.id)}
                            onCheckedChange={(checked: boolean) => handleSelectTimesheet(timesheet.id, checked)}
                            aria-label={`Select timesheet for ${timesheet.worker?.name}`}
                          />
                        </td>
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
                        <td>
                          {timesheet.supervisor_approval === "approved" ? (
                            <Badge className="bg-green-500/10 text-green-700">Approved</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await updateTimesheetData({ id: timesheet.id, supervisor_approval: "approved" });
                                loadTimesheets();
                                toast.success("Timesheet approved!", { description: `${timesheet.worker?.name}'s timesheet on ${format(parseISO(timesheet.date), 'MMM d, yyyy')} approved.` });
                              }}
                            >
                              Approve
                            </Button>
                          )}
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
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(groupedTimesheets.entries()).map(([workerId, workerWeeks]) => (
                <Card key={workerId} className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">{workers.find(w => w.id === workerId)?.name || "Unknown Worker"}</div>
                    <div className="text-sm text-muted-foreground">{workers.find(w => w.id === workerId)?.role || "Worker"}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        Total Hours: <span className="font-medium">{Array.from(workerWeeks.values()).flat().reduce((sum, ts) => sum + ts.total_hours, 0)}h</span>
                      </div>
                      <div>
                        Overtime: <span className="font-medium">{Array.from(workerWeeks.values()).flat().reduce((sum, ts) => sum + ts.overtime_hours, 0)}h</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      Estimated Pay:{" "}
                      <span className="font-medium text-green-600">
                        $
                        {(
                          Array.from(workerWeeks.values()).flat().reduce((sum, ts) => sum + ts.total_hours, 0) * (workers.find(w => w.id === workerId)?.hourly_rate || 20) +
                          Array.from(workerWeeks.values()).flat().reduce((sum, ts) => sum + ts.overtime_hours, 0) * (workers.find(w => w.id === workerId)?.hourly_rate || 20) * 1.5
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
