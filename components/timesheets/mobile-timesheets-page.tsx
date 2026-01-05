"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  subDays,
  addDays,
} from "date-fns"
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  X,
  Check,
  AlertCircle,
  Pencil,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { getTimesheets, updateTimesheet as updateTimesheetData } from "@/lib/data/timesheets"
import { fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data/data"
import type { TimesheetWithDetails, TimesheetFilters } from "@/lib/types"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

interface MobileTimesheetsPageProps {
  userId: string
}

type DateMode = "today" | "week" | "custom"
type ApprovalStatus = "pending" | "approved" | "rejected"

interface WorkerTimesheetGroup {
  worker: Worker
  timesheets: TimesheetWithDetails[]
  totalHours: number
  overtimeHours: number
  primaryStatus: ApprovalStatus
  projects: string[]
}

/**
 * Mobile Timesheets Page Component (Connecteam-inspired)
 *
 * A mobile-first timesheets management page for construction admins.
 * Designed for quick viewing and editing of worker hours on a phone.
 *
 * Features:
 * - Sticky header with date selector (Today/Week/Custom)
 * - Expandable worker cards with daily breakdown
 * - Inline hour editing
 * - Status badges (Pending/Approved)
 * - Search and filter functionality
 */
export function MobileTimesheetsPage({ userId }: MobileTimesheetsPageProps) {
  const router = useRouter()

  // Data state
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [allWorkers, setAllWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [dateMode, setDateMode] = useState<DateMode>("week")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all")
  const [editingCell, setEditingCell] = useState<{ id: string; value: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Week starts on Saturday for construction industry
  const weekStartDay = 6

  // Calculate date range based on mode
  const dateRange = useMemo(() => {
    if (dateMode === "today") {
      return { from: selectedDate, to: selectedDate }
    }
    if (dateMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay })
      return { from: weekStart, to: weekEnd }
    }
    // Custom mode - default to week
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartDay })
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartDay })
    return { from: weekStart, to: weekEnd }
  }, [selectedDate, dateMode, weekStartDay])

  // Get days in the current period
  const periodDays = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
  }, [dateRange])

  // Load data on mount and when date changes
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters: TimesheetFilters = {
        date_from: format(dateRange.from, "yyyy-MM-dd"),
        date_to: format(dateRange.to, "yyyy-MM-dd"),
      }

      const [timesheetsResult, activeWorkers, allWorkersData, projectsData] = await Promise.all([
        getTimesheets(userId, filters),
        fetchWorkersForCompany(userId),
        fetchWorkersForCompany(userId, { includeInactive: true }),
        fetchProjectsForCompany(userId),
      ])

      if (timesheetsResult.success && timesheetsResult.data) {
        setTimesheets(timesheetsResult.data)
      } else {
        setError(timesheetsResult.error || "Failed to load timesheets")
      }

      setWorkers(activeWorkers)
      setAllWorkers(allWorkersData)
      setProjects(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Group timesheets by worker
  const workerGroups = useMemo((): WorkerTimesheetGroup[] => {
    const groups = new Map<string, TimesheetWithDetails[]>()

    // Initialize with active workers
    workers.forEach((worker) => {
      groups.set(worker.id, [])
    })

    // Add timesheets
    timesheets.forEach((ts) => {
      if (!groups.has(ts.worker_id)) {
        groups.set(ts.worker_id, [])
      }
      groups.get(ts.worker_id)!.push(ts)
    })

    // Convert to array with metadata
    const result: WorkerTimesheetGroup[] = []

    Array.from(groups.entries()).forEach(([workerId, workerTimesheets]) => {
      const worker = allWorkers.find((w) => w.id === workerId)
      if (!worker) return

      const totalHours = workerTimesheets.reduce((sum, ts) => sum + ts.total_hours, 0)
      const overtimeHours = workerTimesheets.reduce((sum, ts) => sum + ts.overtime_hours, 0)
      const projects = [...new Set(workerTimesheets.map((ts) => ts.project?.name || "Unknown"))]

      // Determine primary status
      let primaryStatus: ApprovalStatus = "pending"
      if (workerTimesheets.length > 0) {
        const hasApproved = workerTimesheets.some((ts) => ts.supervisor_approval === "approved")
        const hasPending = workerTimesheets.some((ts) => ts.supervisor_approval === "pending")
        if (hasApproved && !hasPending) {
          primaryStatus = "approved"
        } else if (hasPending) {
          primaryStatus = "pending"
        }
      }

      result.push({
        worker,
        timesheets: workerTimesheets,
        totalHours,
        overtimeHours,
        primaryStatus,
        projects,
      })
    })

    return result.sort((a, b) => b.totalHours - a.totalHours)
  }, [timesheets, workers, allWorkers])

  // Filter workers by search and project
  const filteredGroups = useMemo(() => {
    return workerGroups.filter((group) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = group.worker.name.toLowerCase().includes(query)
        const matchesPosition = group.worker.position?.toLowerCase().includes(query)
        const matchesProject = group.projects.some((p) => p.toLowerCase().includes(query))
        if (!matchesName && !matchesPosition && !matchesProject) {
          return false
        }
      }

      // Project filter
      if (selectedProjectFilter !== "all") {
        const hasProject = group.timesheets.some((ts) => ts.project_id === selectedProjectFilter)
        if (!hasProject && group.timesheets.length > 0) {
          return false
        }
      }

      return true
    })
  }, [workerGroups, searchQuery, selectedProjectFilter])

  // Navigation handlers
  const handlePreviousPeriod = () => {
    if (dateMode === "today") {
      setSelectedDate((prev) => subDays(prev, 1))
    } else {
      setSelectedDate((prev) => subDays(prev, 7))
    }
  }

  const handleNextPeriod = () => {
    if (dateMode === "today") {
      setSelectedDate((prev) => addDays(prev, 1))
    } else {
      setSelectedDate((prev) => addDays(prev, 7))
    }
  }

  const handleDateModeChange = (mode: DateMode) => {
    setDateMode(mode)
    if (mode === "today") {
      setSelectedDate(new Date())
    }
  }

  const toggleWorkerExpanded = (workerId: string) => {
    setExpandedWorkers((prev) => {
      const next = new Set(prev)
      if (next.has(workerId)) {
        next.delete(workerId)
      } else {
        next.add(workerId)
      }
      return next
    })
  }

  // Update timesheet hours
  const handleUpdateHours = useCallback(
    async (timesheetId: string, newHours: number) => {
      const timesheet = timesheets.find((ts) => ts.id === timesheetId)
      if (!timesheet || timesheet.supervisor_approval === "approved") return

      const regularHours = Math.min(newHours, 8)
      const overtimeHours = Math.max(0, newHours - 8)
      const hourlyRate = timesheet.worker?.hourly_rate || 0
      const totalPay = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5

      // Optimistic update
      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === timesheetId
            ? {
                ...ts,
                total_hours: newHours,
                regular_hours: regularHours,
                overtime_hours: overtimeHours,
                total_pay: totalPay,
              }
            : ts
        )
      )

      // Server update
      const result = await updateTimesheetData({
        id: timesheetId,
        total_hours: newHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        total_pay: totalPay,
      })

      if (!result.success) {
        // Revert on error
        loadData()
      }

      setEditingCell(null)
    },
    [timesheets]
  )

  const clearSearch = () => setSearchQuery("")

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0.5">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs px-2 py-0.5">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-0 text-xs px-2 py-0.5">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Skeleton loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="px-4 pb-3">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="px-4 pt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <MobileBottomNav />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#2596be] text-white rounded-lg font-medium active:bg-[#1e7a9a]"
          >
            Try Again
          </button>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        </div>

        {/* Date Mode Selector */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {(["today", "week"] as DateMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleDateModeChange(mode)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  dateMode === mode
                    ? "bg-[#2596be] text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                {mode === "today" ? "Today" : "This Week"}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-all ${
                showFilters || selectedProjectFilter !== "all"
                  ? "bg-[#2596be] text-white"
                  : "bg-gray-100 text-gray-600 active:bg-gray-200"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            onClick={handlePreviousPeriod}
            className="p-2.5 rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg active:bg-gray-100 transition-colors"
          >
            <Calendar className="w-5 h-5 text-[#2596be]" />
            <span className="text-sm font-semibold text-gray-900">
              {dateMode === "today"
                ? format(selectedDate, "EEE, MMM d")
                : `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`}
            </span>
          </button>

          <button
            onClick={handleNextPeriod}
            className="p-2.5 rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workers or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-xl border-gray-200 bg-gray-100 focus:bg-white focus:border-[#2596be] focus:ring-[#2596be]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 active:bg-gray-300"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Filter by Project
            </label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:border-[#2596be] focus:ring-[#2596be]"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Worker Cards */}
      <div className="px-4 pt-4 space-y-3">
        {filteredGroups.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No workers found" : "No timesheets yet"}
            </h3>
            <p className="text-sm text-gray-500 text-center px-8">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Add timesheet entries for this period"}
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 text-sm font-medium text-[#2596be] active:text-[#1e7a9a]"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedWorkers.has(group.worker.id)
            const isInactive = !group.worker.is_active

            return (
              <div
                key={group.worker.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
                  isInactive ? "opacity-70" : ""
                }`}
              >
                {/* Worker Header (tap to expand) */}
                <button
                  onClick={() => toggleWorkerExpanded(group.worker.id)}
                  className="w-full p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#2596be] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(group.worker.name)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {group.worker.name}
                      </p>
                      {isInactive && (
                        <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {group.projects.length > 0 ? (
                        <p className="text-sm text-gray-500 truncate">
                          {group.projects.slice(0, 2).join(", ")}
                          {group.projects.length > 2 && ` +${group.projects.length - 2}`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No entries</p>
                      )}
                    </div>
                  </div>

                  {/* Hours & Status */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">{group.totalHours}h</span>
                      {group.overtimeHours > 0 && (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                          +{group.overtimeHours}
                        </span>
                      )}
                    </div>
                    {group.timesheets.length > 0 && getStatusBadge(group.primaryStatus)}
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0 ml-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Daily Breakdown */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-3 space-y-2">
                      {periodDays.map((day) => {
                        const dayStr = format(day, "yyyy-MM-dd")
                        const dayTimesheet = group.timesheets.find(
                          (ts) => format(parseISO(ts.date), "yyyy-MM-dd") === dayStr
                        )
                        const isApproved = dayTimesheet?.supervisor_approval === "approved"
                        const isEditing = editingCell?.id === dayTimesheet?.id

                        return (
                          <div
                            key={dayStr}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              dayTimesheet
                                ? isApproved
                                  ? "bg-green-50"
                                  : "bg-white"
                                : "bg-white"
                            }`}
                          >
                            {/* Date */}
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  isToday(day) ? "text-[#2596be]" : "text-gray-900"
                                }`}
                              >
                                {format(day, "EEE, MMM d")}
                                {isToday(day) && (
                                  <span className="ml-2 text-xs font-normal text-[#2596be]">
                                    Today
                                  </span>
                                )}
                              </p>
                              {dayTimesheet?.project && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[140px]">
                                  {dayTimesheet.project.name}
                                </p>
                              )}
                            </div>

                            {/* Hours & Edit */}
                            <div className="flex items-center gap-2">
                              {dayTimesheet ? (
                                <>
                                  {isEditing && editingCell ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={editingCell.value}
                                        onChange={(e) =>
                                          setEditingCell({ id: dayTimesheet.id, value: e.target.value })
                                        }
                                        onBlur={() => {
                                          if (editingCell) {
                                            handleUpdateHours(
                                              dayTimesheet.id,
                                              parseFloat(editingCell.value) || 0
                                            )
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && editingCell) {
                                            handleUpdateHours(
                                              dayTimesheet.id,
                                              parseFloat(editingCell.value) || 0
                                            )
                                          }
                                          if (e.key === "Escape") {
                                            setEditingCell(null)
                                          }
                                        }}
                                        className="w-16 h-10 text-center text-lg font-bold border-2 border-[#2596be] rounded-lg focus:outline-none"
                                        step="0.5"
                                        min="0"
                                        max="24"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          if (editingCell) {
                                            handleUpdateHours(
                                              dayTimesheet.id,
                                              parseFloat(editingCell.value) || 0
                                            )
                                          }
                                        }}
                                        className="p-2 bg-[#2596be] text-white rounded-lg"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-right">
                                        <span
                                          className={`text-lg font-bold ${
                                            isApproved ? "text-gray-500" : "text-gray-900"
                                          }`}
                                        >
                                          {dayTimesheet.total_hours}h
                                        </span>
                                        {dayTimesheet.overtime_hours > 0 && (
                                          <span className="text-xs text-orange-600 block">
                                            +{dayTimesheet.overtime_hours}h OT
                                          </span>
                                        )}
                                      </div>
                                      {!isApproved && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingCell({
                                              id: dayTimesheet.id,
                                              value: dayTimesheet.total_hours.toString(),
                                            })
                                          }}
                                          className="p-2 rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
                                        >
                                          <Pencil className="w-4 h-4 text-gray-600" />
                                        </button>
                                      )}
                                      {isApproved && (
                                        <div className="p-2">
                                          <Check className="w-4 h-4 text-green-600" />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/timesheets/new?date=${dayStr}&worker=${group.worker.id}`
                                    )
                                  }
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-sm font-medium">Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Week Total Footer */}
                    {dateMode === "week" && (
                      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
                        <span className="text-sm font-medium text-gray-500">Week Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {group.totalHours}h
                          </span>
                          {group.overtimeHours > 0 && (
                            <span className="text-sm font-semibold text-orange-600">
                              ({group.overtimeHours}h OT)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Results count */}
        {!loading && filteredGroups.length > 0 && (
          <p className="text-xs text-gray-500 text-center pt-2 pb-4">
            {filteredGroups.length} worker{filteredGroups.length !== 1 ? "s" : ""} ·{" "}
            {filteredGroups.reduce((sum, g) => sum + g.totalHours, 0)} total hours
          </p>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
