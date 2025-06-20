"use client"

import { useState, useMemo, useEffect } from "react"
import React from "react"
import { User } from "@supabase/supabase-js"
import { CalendarDays, Trash2, SlidersHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

import {
  getTimesheets,
  updateTimesheet as updateTimesheetData,
  deleteTimesheet,
} from "@/lib/data/timesheets"
import type { TimesheetFilters, TimesheetWithDetails } from "@/lib/types"
import { fetchProjectsForCompany, fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { ApprovalsPage } from "./approvals-page"

type AttendanceStatus = "present" | "absent" | "late"

const ITEMS_PER_PAGE = 10;

export default function TimesheetsPage({ user }: { user: User }) {
  // Updated state to use TimesheetWithDetails
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWorker, setSelectedWorker] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<Set<string>>(new Set())
  const [isApproving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1) // Default to Monday
  const [currentPage, setCurrentPage] = useState(1)

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
      const result = await updateTimesheetData({ id, [field]: value })

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

      // Search filter
      const searchMatch = searchTerm.trim() === "" ||
        timesheet.worker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.task_description?.toLowerCase().includes(searchTerm.toLowerCase());

      return dateMatch && workerMatch && projectMatch && searchMatch;
    });
  }, [timesheets, selectedDate, selectedWorker, selectedProject, viewMode, searchTerm, weekStartDay]);

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
  }, [selectedDate, selectedWorker, selectedProject, viewMode, searchTerm, weekStartDay]);

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

  // Helper functions for checkbox logic
  const getAllSelectableTimesheetIds = useMemo(() => {
    if (viewMode === "weekly") {
      const allIds = new Set<string>();
      paginatedWorkerEntries.forEach(([, timesheetsInWeek]) => {
        timesheetsInWeek.forEach((ts: TimesheetWithDetails) => allIds.add(ts.id));
      });
      return allIds;
    } else {
      return new Set(paginatedTimesheets.map((ts: TimesheetWithDetails) => ts.id));
    }
  }, [viewMode, paginatedWorkerEntries, paginatedTimesheets]);

  const isAllSelected = useMemo(() => {
    const allIds = getAllSelectableTimesheetIds;
    const result = allIds.size > 0 && Array.from(allIds).every(id => selectedTimesheetIds.has(id));
    console.log('isAllSelected calculation:', {
      allIdsSize: allIds.size,
      selectedIdsSize: selectedTimesheetIds.size,
      allIds: Array.from(allIds),
      selectedIds: Array.from(selectedTimesheetIds),
      result
    });
    return result;
  }, [getAllSelectableTimesheetIds, selectedTimesheetIds]);

  const handleSelectAll = (checked: boolean) => {
    console.log('handleSelectAll called with:', checked);
    console.log('viewMode:', viewMode);
    console.log('getAllSelectableTimesheetIds:', getAllSelectableTimesheetIds);
    console.log('current selectedTimesheetIds:', selectedTimesheetIds);
    
    if (checked) {
      setSelectedTimesheetIds(getAllSelectableTimesheetIds);
    } else {
      setSelectedTimesheetIds(new Set());
    }
  };

  const handleSelectAllInWeek = (workerId: string, weekStart: string, checked: boolean) => {
    console.log('handleSelectAllInWeek called with:', { workerId, weekStart, checked });
    console.log('viewMode:', viewMode);
    
    setSelectedTimesheetIds(prev => {
      const newSet = new Set(prev);
      
      if (viewMode === "weekly") {
        // For weekly view, get timesheets for this worker from the grouped data
        const timesheetsInWeek = (groupedTimesheets as Map<string, TimesheetWithDetails[]>).get(workerId) || [];
        console.log('timesheetsInWeek for worker:', timesheetsInWeek);
        timesheetsInWeek.forEach(ts => {
          if (checked) {
            newSet.add(ts.id);
          } else {
            newSet.delete(ts.id);
          }
        });
      } else {
        // For daily view, get timesheets for this worker and week
        const workerWeeks = (groupedTimesheets as Map<string, Map<string, TimesheetWithDetails[]>>).get(workerId);
        if (workerWeeks) {
          const timesheetsInWeek = workerWeeks.get(weekStart) || [];
          timesheetsInWeek.forEach(ts => {
            if (checked) {
              newSet.add(ts.id);
            } else {
              newSet.delete(ts.id);
            }
          });
        }
      }
      
      console.log('new selectedTimesheetIds:', newSet);
      return newSet;
    });
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

    const getBadgeClassName = (status: AttendanceStatus) => {
      switch (status) {
        case "present":
          return "bg-[#E8EDF5] text-primary border-[#E8EDF5] text-xs";
        case "absent":
          return "text-xs";
        case "late":
          return "text-xs";
        default:
          return "text-xs";
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

  const handleApproveTimesheet = async (id: string) => {
    try {
      await handleUpdateTimesheet(id, "supervisor_approval", "approved")
      loadTimesheets()
    } catch (error) {
      console.error("Failed to approve timesheet:", error)
    }
  }

  const handleRejectTimesheet = async (id: string) => {
    try {
      const result = await updateTimesheetData({ id, supervisor_approval: "rejected" });
      if (result.success) {
        toast.success("Timesheet rejected successfully");
        loadTimesheets();
      } else {
        toast.error("Failed to reject timesheet");
      }
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
      toast.error("Error rejecting timesheet");
    }
  };

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
    if (viewMode === "weekly") {
      // Move to next week
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 7);
      setSelectedDate(newDate);
    } else {
      // Move to next day
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

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
    <div className="container mx-auto space-y-6 p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Timesheets
        </h1>
        <p className="text-muted-foreground">
          Manage and approve employee timesheets.
        </p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Tabs defaultValue="timesheets" className="w-full">
          <div className="border-b border-muted">
            <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
              <TabsTrigger
                value="timesheets"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
              >
                Timesheets
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="approvals"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
              >
                Approvals
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="timesheets" className="container mx-auto py-4 space-y-6">
            {/* Search, Filters, and Actions Row */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search timesheets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {(selectedWorker !== "all" || selectedProject !== "all" || viewMode !== "weekly") && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                        {(selectedWorker !== "all" ? 1 : 0) + (selectedProject !== "all" ? 1 : 0) + (viewMode !== "weekly" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-4">
                  <DropdownMenuLabel className="text-base font-semibold">
                    Filter Timesheets
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* View Mode Filter */}
                  <div className="space-y-3 py-2">
                    <Label className="text-sm font-medium">View Mode</Label>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "weekly")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      </TabsList>
                    </Tabs>
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

                  {viewMode === "weekly" && (
                    <>
                      <Separator />
                      <div className="space-y-3 py-2">
                        <Label className="text-sm font-medium">Week Starts On</Label>
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
                    </>
                  )}

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
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Create Timesheets Button */}
              <Link href="/dashboard/timesheets/bulk">
                <Button className="bg-[#E8EDF5] hover:bg-[#E8EDF5]/90 text-primary shadow-lg">
                  Create Timesheets
                </Button>
              </Link>
            </div>

            {/* Timesheet Table Header */}
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <div className="flex items-center space-x-2">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    {viewMode === "daily" ? "Daily" : "Weekly"} Timesheet - {format(selectedDate, "PPP")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {viewMode === "weekly" &&
                      `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: weekStartDay }), "MMM d, yyyy")}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handlePreviousPeriod}
                  className="h-10 w-10 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleNextPeriod}
                  className="h-10 w-10 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {selectedTimesheetIds.size > 0 && (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting || isApproving}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
                  >
                    {isDeleting ? "Deleting..." : (<Trash2 className="h-4 w-4" />)}
                  </Button>
                </div>
              )}
            </div>

            {/* Timesheet Table */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <th className="text-left p-4 font-semibold text-sm text-muted-foreground w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all timesheets"
                          />
                        </th>
                        <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Worker</th>
                        <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Project</th>
                        {viewMode === "weekly" ? (
                          weekDays.map((day) => (
                            <th key={day.toISOString()} className="text-center p-4 font-semibold text-sm text-muted-foreground min-w-[100px]">
                              <div className="text-xs text-muted-foreground mb-1">{format(day, "EEE")}</div>
                              <div className="font-medium">{format(day, "MMM d")}</div>
                            </th>
                          ))
                        ) : (
                          <>
                            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Hours</th>
                            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Overtime</th>
                            <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Status</th>
                            <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Notes</th>
                          </>
                        )}
                        {viewMode === "weekly" && <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Total</th>}
                        {viewMode === "weekly" && <th className="text-center p-4 font-semibold text-sm text-muted-foreground"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode === "weekly"
                        ? // Weekly view - one row per worker
                        paginatedWorkerEntries.map(([workerId, timesheetsInWeek]) => {
                          const worker = workers.find(w => w.id === workerId);
                          const isAllInWeekSelected = timesheetsInWeek.length > 0 && timesheetsInWeek.every(ts => selectedTimesheetIds.has(ts.id));
                          const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                          const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                          // Determine if all timesheets in the week are approved
                          const isWeekApproved = timesheetsInWeek.every(ts => ts.supervisor_approval === "approved");

                          return (
                            <tr key={workerId} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">
                              <td className="p-4 w-12">
                                <Checkbox
                                  checked={isAllInWeekSelected}
                                  onCheckedChange={(checked: boolean) => handleSelectAllInWeek(workerId, "", checked)}
                                  aria-label={`Select all timesheets for ${worker?.name || "Unknown Worker"} in week`}
                                />
                              </td>
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
                                          className="w-16 h-8 text-center text-sm border-muted/50 focus:border-primary"
                                          step="0.5"
                                          min="0"
                                          max="24"
                                        />
                                        {getStatusBadge(getAttendanceStatus(dayTimesheet))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">-</span>
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
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-medium">
                                      Approved
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-[#E8EDF5] text-primary border-[#E8EDF5] text-xs font-medium">
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
                              const isAllInWeekSelected = timesheetsInWeek.length > 0 && timesheetsInWeek.every(ts => selectedTimesheetIds.has(ts.id));
                              const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0);
                              const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0);

                              // Determine if all timesheets in the week are approved
                              const isWeekApproved = timesheetsInWeek.every(ts => ts.supervisor_approval === "approved");

                              return (
                                <tr key={`${workerId}-${weekStart}`} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group">
                                  <td className="p-4 w-12">
                                    <Checkbox
                                      checked={isAllInWeekSelected}
                                      onCheckedChange={(checked: boolean) => handleSelectAllInWeek(workerId, weekStart, checked)}
                                      aria-label={`Select all timesheets for ${worker?.name || "Unknown Worker"} in week ${weekStart}`}
                                    />
                                  </td>
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
                                              className="w-16 h-8 text-center text-sm border-muted/50 focus:border-primary"
                                              step="0.5"
                                              min="0"
                                              max="24"
                                            />
                                            {getStatusBadge(getAttendanceStatus(dayTimesheet))}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
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
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-medium">
                                          Approved
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-[#E8EDF5] text-primary border-[#E8EDF5] text-xs font-medium">
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
                {paginatedWorkerEntries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No timesheets found</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {searchTerm || selectedWorker !== "all" || selectedProject !== "all" || viewMode !== "weekly"
                        ? "Try adjusting your filters or search terms"
                        : "Get started by creating your first timesheet"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {((viewMode === "weekly" && weeklyWorkerEntries.length > ITEMS_PER_PAGE) || 
              (viewMode === "daily" && filteredTimesheets.length > ITEMS_PER_PAGE)) && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
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
                            ? "bg-[#E8EDF5] text-primary border-[#E8EDF5]" 
                            : "hover:bg-[#E8EDF5]/70"
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
          </TabsContent>
          <TabsContent value="approvals" className="container mx-auto py-6 space-y-6">
            <ApprovalsPage
              timesheets={timesheets}
              onApprove={handleApproveTimesheet}
              onReject={handleRejectTimesheet}
              user={user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
