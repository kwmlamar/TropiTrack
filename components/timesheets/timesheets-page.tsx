"use client"

import { useState, useMemo, useEffect } from "react"
import React from "react"
import { User } from "@supabase/supabase-js"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns"
import Link from "next/link"

import {
  getTimesheets,
  updateTimesheet as updateTimesheetData,
} from "@/lib/data/timesheets"
import type { TimesheetFilters, TimesheetWithDetails } from "@/lib/types"
import { fetchProjectsForCompany, fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { AddTimesheetDialog } from "./add-timesheet-dialog"

type AttendanceStatus = "present" | "absent" | "late"

const ITEMS_PER_PAGE = 20;

export default function TimesheetsPage({ user }: { user: User }) {
  // Updated state to use TimesheetWithDetails
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWorker] = useState<string>("all")
  const [selectedProject] = useState<string>("all")
  const [viewMode] = useState<"daily" | "weekly">("weekly")
  const weekStartDay = 6 // Hard-coded to Saturday for construction industry
  const [currentPage, setCurrentPage] = useState(1)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null)
  const [selectedCellWorker, setSelectedCellWorker] = useState<Worker | undefined>(undefined)

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
      const [timesheetsResult] = await Promise.all([
        getTimesheets(user.id, filters),
      ])

      if (timesheetsResult.success && timesheetsResult.data) {
        setTimesheets(timesheetsResult.data)
      } else {
        setError(timesheetsResult.error || "Failed to load timesheets")
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
      // Find the timesheet to check if it's approved
      const timesheet = timesheets.find(ts => ts.id === id);
      if (timesheet?.supervisor_approval === "approved") {
        console.warn("Cannot update approved timesheet");
        return;
      }

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

      // Calculate updated values for server update
      let serverUpdateData: { id: string; [key: string]: string | number } = { id, [field]: value }
      
      // If total_hours is being updated, calculate all related fields
      if (field === "total_hours") {
        const totalHours = parseFloat(value)
        const regularHours = Math.min(totalHours, 8)
        const overtimeHours = Math.max(0, totalHours - 8)
        const hourlyRate = timesheets.find(ts => ts.id === id)?.worker?.hourly_rate || 0
        
        serverUpdateData = {
          id,
          total_hours: totalHours,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          total_pay: (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5)
        }
      }

      // Update local state immediately for smooth editing
      setTimesheets((prev) =>
        prev.map((ts) => {
          if (ts.id === id) {
            let updatedTimesheet = { ...ts, [field]: value }
            
            // If total_hours is being updated, calculate regular and overtime hours
            if (field === "total_hours") {
              const totalHours = parseFloat(value)
              const regularHours = Math.min(totalHours, 8)
              const overtimeHours = Math.max(0, totalHours - 8)
              const hourlyRate = ts.worker?.hourly_rate || 0
              
              updatedTimesheet = {
                ...updatedTimesheet,
                total_hours: totalHours,
                regular_hours: regularHours,
                overtime_hours: overtimeHours,
                // Recalculate total pay based on new hours
                total_pay: (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5)
              }
            }
            
            // Preserve nested worker and project data
            return {
              ...updatedTimesheet,
              worker: ts.worker,
              project: ts.project,
            }
          }
          return ts
        })
      )

      // Send update to server in background
      const result = await updateTimesheetData(serverUpdateData)

      if (!result.success) {
        // If server update failed, revert the local state change
        setTimesheets((prev) =>
          prev.map((ts) => {
            if (ts.id === id) {
              return {
                ...ts,
                worker: ts.worker,
                project: ts.project,
              }
            }
            return ts
          })
        )
        setError(result.error || "Failed to update timesheet")
      }
    } catch (err) {
      // If there's an error, revert the local state change
      setTimesheets((prev) =>
        prev.map((ts) => {
          if (ts.id === id) {
            return {
              ...ts,
              worker: ts.worker,
              project: ts.project,
            }
          }
          return ts
        })
      )
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
      const timesheetDate = parseISO(timesheet.date);

      // Date filter
      let dateMatch = false;
      if (viewMode === "daily") {
        dateMatch = format(timesheetDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      } else {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay });
        dateMatch = isWithinInterval(timesheetDate, { start: weekStart, end: weekEnd });
      }

      // Worker filter
      const workerMatch = selectedWorker === "all" || timesheet.worker_id === selectedWorker;

      // Project filter
      const projectMatch = selectedProject === "all" || timesheet.project_id === selectedProject;

      return dateMatch && workerMatch && projectMatch;
    });
  }, [timesheets, selectedDate, selectedWorker, selectedProject, viewMode, weekStartDay]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTimesheets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedWorker, selectedProject, viewMode, weekStartDay]);

  const groupedTimesheets = useMemo(() => {
    if (viewMode === "weekly") {
      // For weekly view, group by worker only - all timesheets for the current week
      // Include all workers, even if they don't have timesheets
      const grouped = new Map<string, TimesheetWithDetails[]>();
      
      // Initialize all workers with empty arrays
      workers.forEach(worker => {
        grouped.set(worker.id, []);
      });
      
      // Add timesheets to their respective workers (use filteredTimesheets to get all timesheets for the week)
      filteredTimesheets.forEach((timesheet) => {
        const workerId = timesheet.worker_id;
        
        if (!grouped.has(workerId)) {
          grouped.set(workerId, []);
        }
        
        grouped.get(workerId)!.push(timesheet);
      });
      
      return grouped;
    } else {
      // For daily view, keep the original grouping by worker and week
      const grouped = new Map<string, Map<string, TimesheetWithDetails[]>>();

      paginatedTimesheets.forEach((timesheet) => {
        const workerId = timesheet.worker_id;
        const timesheetDate = parseISO(timesheet.date);
        const weekStart = startOfWeek(timesheetDate, { weekStartsOn: weekStartDay });
        const weekKey = format(weekStart, "yyyy-MM-dd");

        if (!grouped.has(workerId)) {
          grouped.set(workerId, new Map());
        }

        const workerWeeks = grouped.get(workerId)!;
        if (!workerWeeks.has(weekKey)) {
          workerWeeks.set(weekKey, []);
        }

        workerWeeks.get(weekKey)!.push(timesheet);
      });

      return grouped;
    }
  }, [filteredTimesheets, paginatedTimesheets, weekStartDay, viewMode, workers]);

  // For weekly view, we need to paginate workers instead of timesheets
  const weeklyWorkerEntries = viewMode === "weekly" 
    ? Array.from((groupedTimesheets as Map<string, TimesheetWithDetails[]>).entries())
    : [];
  const weeklyTotalPages = Math.ceil(weeklyWorkerEntries.length / ITEMS_PER_PAGE);
  const weeklyStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const weeklyEndIndex = weeklyStartIndex + ITEMS_PER_PAGE;
  const paginatedWorkerEntries = weeklyWorkerEntries.slice(weeklyStartIndex, weeklyEndIndex);



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

    const getBadgeClassName = (status: AttendanceStatus) => {
      switch (status) {
        case "present":
          return "bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 text-xs font-medium";
        case "absent":
          return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30 text-xs font-medium";
        case "late":
          return "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 text-xs font-medium";
        default:
          return "text-xs font-medium";
      }
    }

    return (
      <Badge variant={variants[status]} className={getBadgeClassName(status)}>
        {labels[status]}
      </Badge>
    )
  }

  const weekDays = useMemo(() => {
    if (viewMode === "daily") {
      return [selectedDate];
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate, viewMode, weekStartDay]);





  // Navigation functions
  const handlePreviousPeriod = () => {
    if (viewMode === "weekly") {
      // Move to previous week
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 7);
      setSelectedDate(newDate);
    } else {
      // Move to previous day
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setSelectedDate(newDate)
  }

  const handleCellClick = (date: Date, workerId: string) => {
    setSelectedCellDate(date)
    const worker = workers.find(w => w.id === workerId)
    setSelectedCellWorker(worker || undefined)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadTimesheets()
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
    <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
      {/* Header Section */}
      {/* Removed Timesheets header and info alert as requested */}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        {/* Timesheet Table Header */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0">
          <div className="flex items-center space-x-2">
            <div>
              <h2 className="text-lg font-medium mb-0">
                {viewMode === "daily" ? "Daily" : "Weekly"} Timesheet{" "}
                {viewMode === "weekly" ? (
                  <span className="text-gray-500">
                    {format(startOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM dd")} - {format(endOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM dd")}
                  </span>
                ) : (
                  <span className="text-gray-500">{format(selectedDate, "PPP")}</span>
                )}
              </h2>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handlePreviousPeriod}
              className="h-10 w-10 p-0 !bg-sidebar border-border hover:!bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleNextPeriod}
              className="h-10 w-10 p-0 !bg-sidebar border-border hover:!bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
                          {/* Create Timesheets Button */}
              <Link href="/dashboard/timesheets/bulk">
                <Button className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors">
                  Create Timesheets
                </Button>
              </Link>

          </div>
        </div>



            {/* Timesheet Table */}
            <Card className="border-0 bg-sidebar overflow-hidden ">
              <CardContent className="px-0 ">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">

                        <th className="text-left p-4 pl-6 font-medium text-sm text-gray-500">Worker</th>
                        <th className="text-left p-4 font-medium text-sm text-gray-500">Project</th>
                        {viewMode === "weekly" ? (
                          weekDays.map((day) => (
                            <th key={day.toISOString()} className="text-center p-4 font-medium text-sm text-gray-500 min-w-[100px]">
                              <div className="text-xs text-gray-400 mb-1">{format(day, "EEE")}</div>
                              <div className="font-medium text-gray-500">{format(day, "MMM d")}</div>
                            </th>
                          ))
                        ) : (
                          <>
                            <th className="text-center p-4 font-medium text-sm text-gray-500">Hours</th>
                            <th className="text-center p-4 font-medium text-sm text-gray-500">Overtime</th>
                            <th className="text-center p-4 font-medium text-sm text-gray-500">Status</th>
                            <th className="text-left p-4 font-medium text-sm text-gray-500">Notes</th>
                          </>
                        )}
                        {viewMode === "weekly" && <th className="text-center p-4 font-medium text-sm text-gray-500">Total</th>}
                        {viewMode === "weekly" && <th className="text-center p-4 font-medium text-sm text-gray-500"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode === "weekly"
                        ? // Weekly view - one row per worker
                        paginatedWorkerEntries.map(([workerId, timesheetsInWeek]) => {
                          const worker = workers.find(w => w.id === workerId);
                          const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                          const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                          // Determine if all timesheets in the week are approved
                          const isWeekApproved = timesheetsInWeek.every(ts => ts.supervisor_approval === "approved");

                          return (
                            <tr key={workerId} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">

                              <td className="p-4 pl-6">
                                <div className="font-medium text-sm">{worker?.name || "Unknown Worker"}</div>
                                <div className="text-xs text-muted-foreground">{worker?.position || "Worker"}</div>
                              </td>
                              <td className="p-4">
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
                                  <td key={day.toISOString()} className="p-4 text-center">
                                    {dayTimesheet ? (
                                      <div className="space-y-2">
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
                                          disabled={dayTimesheet.supervisor_approval === "approved"}
                                          className={`w-16 h-8 text-center text-sm border-muted/50 focus:border-primary ${
                                            dayTimesheet.supervisor_approval === "approved" 
                                              ? "bg-muted/30 cursor-not-allowed opacity-60" 
                                              : ""
                                          }`}
                                          step="0.5"
                                          min="0"
                                          max="24"
                                        />
                                        {getStatusBadge(getAttendanceStatus(dayTimesheet))}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleCellClick(day, workerId);
                                        }}
                                        className="w-full h-8 text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground rounded border border-dashed border-muted-foreground/30 transition-colors duration-200 flex items-center justify-center"
                                        title="Click to add timesheet entry"
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="p-4 text-center">
                                <div className="font-medium text-sm">{weekTotalHours}h</div>
                                {weekOvertimeHours > 0 && (
                                  <div className="text-xs text-orange-600 font-medium">+{weekOvertimeHours}h OT</div>
                                )}
                              </td>
                              <td className="p-4 pr-6 text-center">
                                {timesheetsInWeek.length > 0 && (
                                  isWeekApproved ? (
                                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 text-xs font-medium">
                                      Approved
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 text-xs font-medium">
                                      Pending
                                    </Badge>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })
                        :
                        // Daily view - keep original logic
                        Array.from((groupedTimesheets as Map<string, Map<string, TimesheetWithDetails[]>>).entries()).map(([workerId, workerWeeks]) => (
                          <React.Fragment key={workerId}>
                            {Array.from(workerWeeks.entries()).map(([weekStart, timesheetsInWeek]) => {
                              const worker = workers.find(w => w.id === workerId);
                              const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                              const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                              // Determine if all timesheets in the week are approved
                              const isWeekApproved = timesheetsInWeek.every(ts => ts.supervisor_approval === "approved");

                              return (
                                <tr key={`${workerId}-${weekStart}`} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">

                                  <td className="p-4">
                                    <div className="font-medium text-sm">{worker?.name || "Unknown Worker"}</div>
                                    <div className="text-xs text-muted-foreground">{worker?.position || "Worker"}</div>
                                  </td>
                                  <td className="p-4">
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
                                      <td key={day.toISOString()} className="p-4 text-center">
                                        {dayTimesheet ? (
                                          <div className="space-y-2">
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
                                              disabled={dayTimesheet.supervisor_approval === "approved"}
                                              className={`w-16 h-8 text-center text-sm border-muted/50 focus:border-primary ${
                                                dayTimesheet.supervisor_approval === "approved" 
                                                  ? "bg-muted/30 cursor-not-allowed opacity-60" 
                                                  : ""
                                              }`}
                                              step="0.5"
                                              min="0"
                                              max="24"
                                            />
                                            {getStatusBadge(getAttendanceStatus(dayTimesheet))}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleCellClick(day, workerId);
                                            }}
                                            className="w-full h-8 text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground rounded border border-dashed border-muted-foreground/30 transition-colors duration-200 flex items-center justify-center"
                                            title="Click to add timesheet entry"
                                          >
                                            +
                                          </button>
                                        )}
                                      </td>
                                    )
                                  })}
                                  <td className="p-4 text-center">
                                    <div className="font-medium text-sm">{weekTotalHours}h</div>
                                    {weekOvertimeHours > 0 && (
                                      <div className="text-xs text-orange-600 font-medium">+{weekOvertimeHours}h OT</div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center">
                                    {timesheetsInWeek.length > 0 && (
                                      isWeekApproved ? (
                                        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 text-xs font-medium">
                                          Approved
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 text-xs font-medium">
                                          Pending
                                        </Badge>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Empty State */}
                {((viewMode === "weekly" && paginatedWorkerEntries.length === 0) || 
                  (viewMode === "daily" && paginatedTimesheets.length === 0)) && (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No timesheets found</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {selectedWorker !== "all" || selectedProject !== "all" || viewMode !== "weekly"
                        ? "Try adjusting your filters"
                        : "Get started by creating your first timesheet"
                      }
                    </p>
                  </div>
                )}

                {/* Pagination Controls */}
                {((viewMode === "weekly" && weeklyWorkerEntries.length > ITEMS_PER_PAGE) || 
                  (viewMode === "daily" && filteredTimesheets.length > ITEMS_PER_PAGE)) && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {viewMode === "weekly" 
                        ? `Showing ${weeklyStartIndex + 1} to ${Math.min(weeklyEndIndex, weeklyWorkerEntries.length)} of ${weeklyWorkerEntries.length} workers`
                        : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredTimesheets.length)} of ${filteredTimesheets.length} timesheets`
                      }
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: viewMode === "weekly" ? weeklyTotalPages : totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={`h-8 w-8 p-0 ${
                              currentPage === page 
                                ? "bg-muted text-gray-800 border-muted dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500" 
                                : "hover:bg-muted dark:hover:bg-gray-600 dark:hover:text-gray-100"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === (viewMode === "weekly" ? weeklyTotalPages : totalPages)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

      {/* Add Timesheet Dialog */}
      {selectedCellDate && (
        <AddTimesheetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedCellDate}
          workers={workers}
          projects={projects}
          userId={user.id}
          selectedWorker={selectedCellWorker}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}
