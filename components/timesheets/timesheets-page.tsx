"use client"

import { useState, useMemo, useEffect } from "react"
import React from "react"
import { User } from "@supabase/supabase-js"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { UnapproveTimesheetDialog } from "./unapprove-timesheet-dialog"
import { getCurrentLocalDate } from "@/lib/utils"
import { useDateRange } from "@/context/date-range-context"

const ITEMS_PER_PAGE = 20;

export default function TimesheetsPage({ user }: { user: User }) {
  // Updated state to use TimesheetWithDetails
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use date range context instead of local selectedDate
  const { dateRange, setDateRange } = useDateRange()
  const selectedDate = dateRange?.from || getCurrentLocalDate()
  
  const [selectedWorker] = useState<string>("all")
  const [selectedProject] = useState<string>("all")
  const [viewMode] = useState<"daily" | "weekly">("weekly")
  const weekStartDay = 6 // Hard-coded to Saturday for construction industry
  const [currentPage, setCurrentPage] = useState(1)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null)
  const [selectedCellWorker, setSelectedCellWorker] = useState<Worker | undefined>(undefined)
  
  // Unapprove dialog state
  const [unapproveDialogOpen, setUnapproveDialogOpen] = useState(false)
  const [selectedTimesheetForUnapprove, setSelectedTimesheetForUnapprove] = useState<{
    id: string
    workerName: string
    date: string
    displayDate: string
    workerId: string
    userId: string
  } | null>(null)

  // Load timesheets effect
  useEffect(() => {
    loadTimesheets();
    loadWorkers();
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedWorker, selectedProject, viewMode, weekStartDay])

  // CRUD operations
  const loadTimesheets = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters: TimesheetFilters = {}

      // Apply date filters using date range from context
      if (dateRange?.from && dateRange?.to) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      } else {
        // Fallback to current date if no date range is set
        const fallbackDate = getCurrentLocalDate()
        filters.date_from = format(fallbackDate, "yyyy-MM-dd")
        filters.date_to = format(fallbackDate, "yyyy-MM-dd")
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
  // Filter timesheets based on selected filters
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      const timesheetDate = parseISO(timesheet.date);

      // Date filter using date range from context
      let dateMatch = false;
      if (dateRange?.from && dateRange?.to) {
        dateMatch = isWithinInterval(timesheetDate, { start: dateRange.from, end: dateRange.to });
      } else {
        // Fallback to current date if no date range is set
        const fallbackDate = getCurrentLocalDate();
        dateMatch = format(timesheetDate, "yyyy-MM-dd") === format(fallbackDate, "yyyy-MM-dd");
      }

      // Worker filter
      const workerMatch = selectedWorker === "all" || timesheet.worker_id === selectedWorker;

      // Project filter
      const projectMatch = selectedProject === "all" || timesheet.project_id === selectedProject;

      return dateMatch && workerMatch && projectMatch;
    });
  }, [timesheets, dateRange, selectedWorker, selectedProject]);

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
  }, [dateRange, selectedWorker, selectedProject, viewMode, weekStartDay]);

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

  const weekDays = useMemo(() => {
    if (viewMode === "daily") {
      return [selectedDate];
    }
    // Use date range from context if available, otherwise fallback to selectedDate
    if (dateRange?.from && dateRange?.to) {
      return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate, viewMode, weekStartDay, dateRange]);





  // Navigation functions
  const handlePreviousPeriod = () => {
    if (viewMode === "weekly") {
      // Move to previous week
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 7);
      const weekStart = startOfWeek(newDate, { weekStartsOn: weekStartDay });
      const weekEnd = endOfWeek(newDate, { weekStartsOn: weekStartDay });
      setDateRange({ from: weekStart, to: weekEnd });
    } else {
      // Move to previous day
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 1);
      setDateRange({ from: newDate, to: newDate });
    }
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + 1)
      setDateRange({ from: newDate, to: newDate });
    } else {
      newDate.setDate(newDate.getDate() + 7)
      const weekStart = startOfWeek(newDate, { weekStartsOn: weekStartDay });
      const weekEnd = endOfWeek(newDate, { weekStartsOn: weekStartDay });
      setDateRange({ from: weekStart, to: weekEnd });
    }
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

  const handleDisabledInputClick = (timesheet: TimesheetWithDetails) => {
    if (timesheet.supervisor_approval === "approved") {
      setSelectedTimesheetForUnapprove({
        id: timesheet.id,
        workerName: timesheet.worker?.name || "Unknown Worker",
        date: timesheet.date, // Pass the original ISO date string
        displayDate: format(parseISO(timesheet.date), "MMM d, yyyy"), // For display purposes
        workerId: timesheet.worker_id,
        userId: user.id
      })
      setUnapproveDialogOpen(true)
    }
  }

  const handleUnapproveSuccess = () => {
    loadTimesheets()
    setUnapproveDialogOpen(false)
    setSelectedTimesheetForUnapprove(null)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
          {/* Header Skeleton */}
          <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
            <div className="flex items-center space-x-2">
              <div>
                <div className="h-6 w-48 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50 mb-2" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-10 w-10 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-9 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="border-t border-b border-border/50 bg-white flex-1 flex flex-col">
            <div className="px-0 flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1 overflow-y-auto">
                <table className="w-full border-collapse border-spacing-0 h-full">
                  <thead className="sticky top-0 z-50 bg-white border-b-2 border-gray-400 shadow-sm">
                    <tr className="bg-white">
                      <th className="text-left p-4 pl-6 pb-4 font-medium text-sm text-gray-500 bg-white">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      <th className="text-left p-4 pb-4 font-medium text-sm text-gray-500 bg-white">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <th key={i} className="text-center px-4 py-2 font-medium text-sm text-gray-500 min-w-[100px] bg-white">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="h-3 w-8 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            <div className="h-6 w-8 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            <div className="h-3 w-8 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-4 pb-4 font-medium text-sm text-gray-500 bg-white">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      <th className="text-center p-4 pb-4 font-medium text-sm text-gray-500 bg-white">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-muted/20 last:border-b-0">
                        <td className="p-4 pl-6">
                          <div className="space-y-1">
                            <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                        </td>
                        {Array.from({ length: 7 }).map((_, colIndex) => {
                          // Friday is index 4 in a Saturday-starting week
                          const isFriday = colIndex === 6
                          return (
                          <td key={colIndex} className={`p-4 text-center border-l border-border/30 ${isFriday ? 'border-r border-border/30' : ''}`}>
                            <div className="space-y-2">
                              <div className="h-8 w-16 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                              <div className="h-5 w-12 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            </div>
                          </td>
                          )
                        })}
                        <td className="p-4 text-center">
                          <div className="space-y-1">
                            <div className="h-4 w-12 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            <div className="h-3 w-8 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <div className="h-6 w-16 mx-auto animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
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
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Section */}
      {/* Removed Timesheets header and info alert as requested */}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Timesheet Table Header */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
          <div className="flex items-center space-x-2">
            <div>
              <h2 className="text-lg font-medium mb-0">
                {viewMode === "daily" ? "Daily" : "Weekly"} Timesheet{" "}
                {dateRange?.from && dateRange?.to ? (
                  <span className="text-gray-500">
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
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
                <Button>
                  Create Timesheets
                </Button>
              </Link>

          </div>
        </div>



            {/* Timesheet Table */}
            <div className="border-t border-b border-border/50 bg-white flex-1 flex flex-col">
              <div className="px-0 flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1 overflow-y-auto">
                  <table className="w-full border-collapse border-spacing-0 h-full">
                    <thead className="sticky top-0 z-50 bg-white border-b-2 border-gray-400 shadow-sm">
                      <tr className="bg-white">

                        <th className="text-left p-4 pl-6 pb-4 font-medium text-sm text-gray-500 bg-white">Worker</th>
                        <th className="text-left p-4 pb-4 font-medium text-sm text-gray-500 bg-white">Project</th>
                        {viewMode === "weekly" ? (
                          weekDays.map((day) => (
                            <th key={day.toISOString()} className="text-center px-4 py-2 font-medium text-sm text-gray-500 min-w-[100px] bg-white">
                              <div className="text-xs text-gray-400 leading-none">{format(day, "EEE")}</div>
                              <div className="text-xl font-bold text-gray-700 leading-tight my-0.5">{format(day, "d")}</div>
                              <div className="text-xs text-gray-500 leading-none">{format(day, "MMM")}</div>
                            </th>
                          ))
                        ) : (
                          <>
                            <th className="text-center p-4 pb-4 font-medium text-sm text-gray-500 bg-white">Hours</th>
                            <th className="text-center p-4 pb-4 font-medium text-sm text-gray-500 bg-white">Overtime</th>
                            <th className="text-left p-4 pb-4 font-medium text-sm text-gray-500 bg-white">Notes</th>
                          </>
                        )}
                        {viewMode === "weekly" && <th className="text-center p-4 pb-4 font-medium text-sm text-gray-500 bg-white">Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode === "weekly"
                        ? // Weekly view - one row per worker
                        paginatedWorkerEntries.map(([workerId, timesheetsInWeek]) => {
                          const worker = workers.find(w => w.id === workerId);
                          const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                          const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                          return (
                            <tr key={workerId} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">

                              <td className="p-4 pl-6">
                                <div className="font-medium text-sm">{worker?.name || "Unknown Worker"}</div>
                                <div className="text-xs text-gray-500">{worker?.position || "Worker"}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm text-gray-500">
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
                                const isFriday = format(day, "EEE") === "Fri"
                                const getBgColor = () => {
                                  if (!dayTimesheet) return ''
                                  if (dayTimesheet.supervisor_approval === "approved") return 'bg-muted-foreground/10'
                                  if (dayTimesheet.supervisor_approval === "pending") return ''
                                  return ''
                                }
                                return (
                                  <td key={day.toISOString()} className={`p-2 text-center border-l border-border/30 ${isFriday ? 'border-r border-border/30' : ''} ${getBgColor()}`}>
                                    {dayTimesheet ? (
                                      <div className="flex flex-col items-center justify-center min-h-[60px]">
                                        {dayTimesheet.supervisor_approval === "approved" ? (
                                          <div
                                            onClick={() => handleDisabledInputClick(dayTimesheet)}
                                            className="cursor-pointer w-full"
                                            title="Click to unapprove timesheet"
                                          >
                                            <div className="text-2xl font-semibold text-gray-400 mb-1">
                                              {dayTimesheet.total_hours}
                                            </div>
                                            {dayTimesheet.overtime_hours > 0 && (
                                              <div className="text-xs text-orange-600 font-medium">
                                                +{dayTimesheet.overtime_hours}h
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <>
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
                                              className="w-full h-10 text-center text-lg font-semibold border-0 bg-transparent focus:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                              step="0.5"
                                              min="0"
                                              max="24"
                                            />
                                            {dayTimesheet.overtime_hours > 0 && (
                                              <div className="text-xs text-orange-600 font-medium mt-1">
                                                +{dayTimesheet.overtime_hours}h
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleCellClick(day, workerId);
                                        }}
                                        className="w-full min-h-[60px] text-gray-300 text-2xl hover:bg-gray-50 hover:text-gray-400 transition-colors duration-200 flex items-center justify-center"
                                        title="Click to add timesheet entry"
                                      >
                                        +
                                      </button>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="p-4 text-center">
                                <div className="font-medium text-sm text-gray-500">{weekTotalHours}h</div>
                                {weekOvertimeHours > 0 && (
                                  <div className="text-xs text-orange-600 font-medium">+{weekOvertimeHours}h OT</div>
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

                              return (
                                <tr key={`${workerId}-${weekStart}`} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">

                                  <td className="p-4">
                                    <div className="font-medium text-sm">{worker?.name || "Unknown Worker"}</div>
                                    <div className="text-xs text-gray-500">{worker?.position || "Worker"}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-sm text-gray-500">
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
                                    const isFriday = format(day, "EEE") === "Fri"
                                    const getBgColor = () => {
                                      if (!dayTimesheet) return ''
                                      if (dayTimesheet.supervisor_approval === "approved") return 'bg-muted-foreground/10'
                                      if (dayTimesheet.supervisor_approval === "pending") return ''
                                      return ''
                                    }
                                    return (
                                      <td key={day.toISOString()} className={`p-2 text-center border-l border-border/30 ${isFriday ? 'border-r border-border/30' : ''} ${getBgColor()}`}>
                                        {dayTimesheet ? (
                                          <div className="flex flex-col items-center justify-center min-h-[60px]">
                                            {dayTimesheet.supervisor_approval === "approved" ? (
                                              <div
                                                onClick={() => handleDisabledInputClick(dayTimesheet)}
                                                className="cursor-pointer w-full"
                                                title="Click to unapprove timesheet"
                                              >
                                                <div className="text-2xl font-semibold text-gray-400 mb-1">
                                                  {dayTimesheet.total_hours}
                                                </div>
                                                {dayTimesheet.overtime_hours > 0 && (
                                                  <div className="text-xs text-orange-600 font-medium">
                                                    +{dayTimesheet.overtime_hours}h
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <>
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
                                                  className="w-full h-10 text-center text-lg font-semibold border-0 bg-transparent focus:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                                  step="0.5"
                                                  min="0"
                                                  max="24"
                                                />
                                                {dayTimesheet.overtime_hours > 0 && (
                                                  <div className="text-xs text-orange-600 font-medium mt-1">
                                                    +{dayTimesheet.overtime_hours}h
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleCellClick(day, workerId);
                                            }}
                                            className="w-full min-h-[60px] text-gray-300 text-2xl hover:bg-gray-50 hover:text-gray-400 transition-colors duration-200 flex items-center justify-center"
                                            title="Click to add timesheet entry"
                                          >
                                            +
                                          </button>
                                        )}
                                      </td>
                                    )
                                  })}
                                  <td className="p-4 text-center">
                                    <div className="font-medium text-sm text-gray-500">{weekTotalHours}h</div>
                                    {weekOvertimeHours > 0 && (
                                      <div className="text-xs text-orange-600 font-medium">+{weekOvertimeHours}h OT</div>
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
                      <CalendarDays className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">No timesheets found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-sm">
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
                    <div className="text-sm text-gray-500">
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
              </div>
            </div>
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

      {/* Unapprove Timesheet Dialog */}
      {selectedTimesheetForUnapprove && (
        <UnapproveTimesheetDialog
          open={unapproveDialogOpen}
          onOpenChange={setUnapproveDialogOpen}
          timesheetId={selectedTimesheetForUnapprove.id}
          workerName={selectedTimesheetForUnapprove.workerName}
          date={selectedTimesheetForUnapprove.date}
          displayDate={selectedTimesheetForUnapprove.displayDate}
          workerId={selectedTimesheetForUnapprove.workerId}
          userId={selectedTimesheetForUnapprove.userId}
          onSuccess={handleUnapproveSuccess}
        />
      )}
    </div>
  )
}
