"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns"
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FolderKanban,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/utils/supabase/client"

type ApprovalStatus = "pending" | "approved" | "rejected"

interface TimesheetWithDetails {
  id: string
  date: string
  worker_id: string
  project_id: string
  task_description: string
  clock_in: string
  clock_out: string
  break_duration: number
  regular_hours: number
  overtime_hours: number
  total_hours: number
  total_pay: number
  supervisor_approval: ApprovalStatus
  notes?: string
  created_at?: string
  updated_at?: string
  worker?: {
    id: string
    name: string
    role?: string
    hourly_rate?: number
    position?: string
    department?: string
  }
  project?: {
    id: string
    name: string
    location?: string
  }
}

/**
 * WorkerGroup represents a worker with all their pending timesheets grouped together.
 * This enables bulk approval and provides summary stats (total hours, date range).
 */
interface WorkerGroup {
  workerId: string
  workerName: string
  workerPosition?: string
  timesheets: TimesheetWithDetails[]
  totalHours: number
  totalOvertimeHours: number
  totalPay: number
  entryCount: number
  dateRange: {
    earliest: string
    latest: string
  }
}

const STATUS_TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

/**
 * Groups timesheets by worker and calculates aggregate statistics.
 * Each worker group contains: total hours, overtime, pay, entry count, and date range.
 */
function groupTimesheetsByWorker(timesheets: TimesheetWithDetails[]): WorkerGroup[] {
  const groupMap = new Map<string, WorkerGroup>()

  timesheets.forEach((ts) => {
    const workerId = ts.worker_id
    const existing = groupMap.get(workerId)

    if (existing) {
      // Add to existing group
      existing.timesheets.push(ts)
      existing.totalHours += ts.total_hours
      existing.totalOvertimeHours += ts.overtime_hours
      existing.totalPay += ts.total_pay
      existing.entryCount += 1

      // Update date range
      if (ts.date < existing.dateRange.earliest) {
        existing.dateRange.earliest = ts.date
      }
      if (ts.date > existing.dateRange.latest) {
        existing.dateRange.latest = ts.date
      }
    } else {
      // Create new group for this worker
      groupMap.set(workerId, {
        workerId,
        workerName: ts.worker?.name || "Unknown Worker",
        workerPosition: ts.worker?.position,
        timesheets: [ts],
        totalHours: ts.total_hours,
        totalOvertimeHours: ts.overtime_hours,
        totalPay: ts.total_pay,
        entryCount: 1,
        dateRange: {
          earliest: ts.date,
          latest: ts.date,
        },
      })
    }
  })

  // Sort groups by worker name for consistent ordering
  return Array.from(groupMap.values()).sort((a, b) =>
    a.workerName.localeCompare(b.workerName)
  )
}

export function MobileApprovalsPage() {
  const router = useRouter()
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending")
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  // Expanded worker cards state - tracks which workers have their details expanded
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(new Set())

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const weekStartDay = 6 // Saturday

  useEffect(() => {
    fetchTimesheets()
    getUser()
  }, [])

  const getUser = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/approvals")
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch timesheets")
      }

      setTimesheets(result.data || [])
    } catch (err) {
      console.error("Error fetching timesheets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch timesheets")
    } finally {
      setLoading(false)
    }
  }

  // Filter timesheets by status and group by worker
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((ts) => ts.supervisor_approval === activeTab)
  }, [timesheets, activeTab])

  // Group filtered timesheets by worker for the card view
  const workerGroups = useMemo(() => {
    return groupTimesheetsByWorker(filteredTimesheets)
  }, [filteredTimesheets])

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

  /**
   * Approves a single timesheet and generates payroll for the affected period.
   */
  const handleApprove = async (id: string) => {
    try {
      setIsProcessing(id)

      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to approve timesheet")
      }

      // Generate payroll for the approved timesheet
      const approvedTimesheet = timesheets.find((ts) => ts.id === id)
      if (approvedTimesheet && user?.id) {
        const weekStart = format(
          startOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }),
          "yyyy-MM-dd"
        )
        const weekEnd = format(
          endOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }),
          "yyyy-MM-dd"
        )

        try {
          const payrollResponse = await fetch("/api/generate-payroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workerId: approvedTimesheet.worker_id,
              weekStart,
              weekEnd,
              userId: user.id,
            }),
          })

          const payrollResult = await payrollResponse.json()

          if (!payrollResponse.ok || !payrollResult.success) {
            console.error("Payroll generation failed:", payrollResult)
            toast.error(`Timesheet approved but payroll generation failed: ${payrollResult.message || "Unknown error"}`)
          } else {
            toast.success("Timesheet approved and payroll generated")
          }
        } catch (payrollError) {
          console.error("Error generating payroll:", payrollError)
          toast.error("Timesheet approved but payroll generation failed")
        }
      } else {
        toast.success("Timesheet approved")
      }

      await fetchTimesheets()
    } catch (error) {
      console.error("Error approving timesheet:", error)
      toast.error("Failed to approve timesheet")
    } finally {
      setIsProcessing(null)
    }
  }

  /**
   * Approves all pending timesheets for a worker in one action.
   * Uses optimistic UI update for immediate feedback.
   */
  const handleApproveAll = async (workerGroup: WorkerGroup) => {
    const timesheetIds = workerGroup.timesheets.map((ts) => ts.id)
    if (timesheetIds.length === 0) return

    try {
      setIsBulkProcessing(workerGroup.workerId)

      // Optimistic update - remove from UI immediately
      setTimesheets((prev) =>
        prev.map((ts) =>
          timesheetIds.includes(ts.id)
            ? { ...ts, supervisor_approval: "approved" as ApprovalStatus }
            : ts
        )
      )

      // Approve all timesheets in parallel
      const approvalPromises = timesheetIds.map((id) =>
        fetch(`/api/approvals/${id}/approve`, { method: "POST" }).then((r) => r.json())
      )

      const results = await Promise.all(approvalPromises)
      const failures = results.filter((r) => !r.success)

      if (failures.length > 0) {
        // Revert optimistic update on partial failure
        await fetchTimesheets()
        throw new Error(`Failed to approve ${failures.length} timesheet(s)`)
      }

      // Generate payroll for affected periods
      // Group timesheets by week to avoid duplicate payroll generation
      let payrollSuccess = true
      const payrollErrors: string[] = []

      if (user?.id) {
        const weekPeriods = new Map<string, { weekStart: string; weekEnd: string }>()

        workerGroup.timesheets.forEach((ts) => {
          const weekStart = format(
            startOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }),
            "yyyy-MM-dd"
          )
          const weekEnd = format(
            endOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }),
            "yyyy-MM-dd"
          )
          weekPeriods.set(weekStart, { weekStart, weekEnd })
        })

        // Generate payroll for each affected week
        for (const { weekStart, weekEnd } of weekPeriods.values()) {
          try {
            const payrollResponse = await fetch("/api/generate-payroll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workerId: workerGroup.workerId,
                weekStart,
                weekEnd,
                userId: user.id,
              }),
            })

            const payrollResult = await payrollResponse.json()

            if (!payrollResponse.ok || !payrollResult.success) {
              payrollSuccess = false
              payrollErrors.push(payrollResult.message || "Unknown error")
              console.error("Payroll generation failed:", payrollResult)
            }
          } catch (payrollError) {
            payrollSuccess = false
            payrollErrors.push(payrollError instanceof Error ? payrollError.message : "Unknown error")
            console.error("Error generating payroll:", payrollError)
          }
        }
      }

      if (payrollSuccess) {
        toast.success(
          `Approved ${timesheetIds.length} timesheet${timesheetIds.length > 1 ? "s" : ""} for ${workerGroup.workerName} and payroll generated`
        )
      } else {
        toast.warning(
          `Approved ${timesheetIds.length} timesheet${timesheetIds.length > 1 ? "s" : ""} for ${workerGroup.workerName} but some payroll generation failed`
        )
      }

      // Collapse the expanded view after approval
      setExpandedWorkers((prev) => {
        const next = new Set(prev)
        next.delete(workerGroup.workerId)
        return next
      })

      // Refresh to ensure consistency
      await fetchTimesheets()
    } catch (error) {
      console.error("Error in bulk approval:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to approve timesheets"
      )
      // Refresh to revert optimistic update
      await fetchTimesheets()
    } finally {
      setIsBulkProcessing(null)
    }
  }

  const openRejectModal = (id: string) => {
    setRejectingId(id)
    setRejectionReason("")
    setRejectModalOpen(true)
  }

  const closeRejectModal = () => {
    setRejectModalOpen(false)
    setRejectingId(null)
    setRejectionReason("")
  }

  const handleReject = async () => {
    if (!rejectingId) return

    try {
      setIsProcessing(rejectingId)
      closeRejectModal()

      const response = await fetch(`/api/approvals/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to reject timesheet")
      }

      toast.success("Timesheet rejected")
      await fetchTimesheets()
    } catch (error) {
      console.error("Error rejecting timesheet:", error)
      toast.error("Failed to reject timesheet")
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
    }
  }

  const getTabCounts = () => {
    const counts = { pending: 0, approved: 0, rejected: 0 }
    timesheets.forEach((ts) => {
      counts[ts.supervisor_approval]++
    })
    return counts
  }

  const tabCounts = getTabCounts()

  /**
   * Formats a date range for display.
   * Shows single date if same day, or "MMM d - d" if same month, or "MMM d - MMM d" otherwise.
   */
  const formatDateRange = (earliest: string, latest: string): string => {
    const start = parseISO(earliest)
    const end = parseISO(latest)

    if (earliest === latest) {
      return format(start, "MMM d, yyyy")
    }

    if (format(start, "MMM yyyy") === format(end, "MMM yyyy")) {
      return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`
    }

    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Approvals</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {tab.label}
                {tabCounts[tab.value] > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      activeTab === tab.value
                        ? "bg-[#2596be] text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tabCounts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Worker Groups List */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading timesheets...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">{error}</p>
            <button
              onClick={fetchTimesheets}
              className="text-sm font-medium text-[#2596be]"
            >
              Try again
            </button>
          </div>
        ) : workerGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No {activeTab} timesheets
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {activeTab === "pending"
                ? "All timesheets have been reviewed"
                : `No ${activeTab} timesheets to display`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Worker Group Cards */}
            {workerGroups.map((group) => {
              const isExpanded = expandedWorkers.has(group.workerId)
              const isProcessingThisWorker = isBulkProcessing === group.workerId

              return (
                <div
                  key={group.workerId}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Worker Card Header - Always visible */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#2596be]/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-[#2596be]" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {group.workerName}
                          </p>
                          {group.workerPosition && (
                            <p className="text-sm text-gray-500">
                              {group.workerPosition}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Entry count badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <FileText className="w-3 h-3" />
                        {group.entryCount} {group.entryCount === 1 ? "entry" : "entries"}
                      </span>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {/* Total Hours */}
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">Hours</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {group.totalHours.toFixed(1)}h
                        </p>
                        {group.totalOvertimeHours > 0 && (
                          <p className="text-xs text-gray-500">
                            {group.totalOvertimeHours.toFixed(1)}h OT
                          </p>
                        )}
                      </div>

                      {/* Total Pay */}
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                          <span className="text-xs font-medium">$</span>
                          <span className="text-xs">Pay</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          ${group.totalPay.toFixed(0)}
                        </p>
                      </div>

                      {/* Date Range */}
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Dates</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 leading-tight">
                          {formatDateRange(
                            group.dateRange.earliest,
                            group.dateRange.latest
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons (only for pending tab) */}
                    {activeTab === "pending" && (
                      <div className="flex items-center gap-2">
                        {/* Review Details - Secondary action */}
                        <button
                          onClick={() => toggleWorkerExpanded(group.workerId)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm active:bg-gray-50 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Review Details
                            </>
                          )}
                        </button>

                        {/* Approve All - Primary action */}
                        <button
                          onClick={() => handleApproveAll(group)}
                          disabled={isProcessingThisWorker}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-600 text-white font-medium text-sm active:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isProcessingThisWorker ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Approve All
                        </button>
                      </div>
                    )}

                    {/* For approved/rejected tabs, just show expand button */}
                    {activeTab !== "pending" && (
                      <button
                        onClick={() => toggleWorkerExpanded(group.workerId)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm active:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View Details
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Detail View - Individual Timesheets */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="p-3 space-y-2">
                        {group.timesheets
                          .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
                          .map((timesheet) => (
                            <div
                              key={timesheet.id}
                              className="bg-white border border-gray-100 rounded-lg p-3"
                            >
                              {/* Timesheet Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {format(parseISO(timesheet.date), "EEE, MMM d")}
                                  </span>
                                  {getStatusBadge(timesheet.supervisor_approval)}
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                  {timesheet.total_hours.toFixed(1)}h
                                </span>
                              </div>

                              {/* Project & Details */}
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <FolderKanban className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[140px]">
                                    {timesheet.project?.name || "No project"}
                                  </span>
                                </div>
                                <span>${timesheet.total_pay.toFixed(2)}</span>
                              </div>

                              {/* Time details */}
                              <div className="text-xs text-gray-400 mb-2">
                                {timesheet.clock_in} - {timesheet.clock_out}
                                {timesheet.overtime_hours > 0 && (
                                  <span className="ml-2 text-amber-600">
                                    +{timesheet.overtime_hours.toFixed(1)}h OT
                                  </span>
                                )}
                              </div>

                              {/* Individual Actions (only for pending) */}
                              {activeTab === "pending" && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                  <button
                                    onClick={() => openRejectModal(timesheet.id)}
                                    disabled={
                                      isProcessing === timesheet.id ||
                                      isProcessingThisWorker
                                    }
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-red-600 font-medium text-xs active:bg-red-50 transition-colors disabled:opacity-50"
                                  >
                                    {isProcessing === timesheet.id ? (
                                      <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <X className="w-3 h-3" />
                                    )}
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleApprove(timesheet.id)}
                                    disabled={
                                      isProcessing === timesheet.id ||
                                      isProcessingThisWorker
                                    }
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-green-600 text-white font-medium text-xs active:bg-green-700 transition-colors disabled:opacity-50"
                                  >
                                    {isProcessing === timesheet.id ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Approve
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeRejectModal}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Reject Timesheet
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide a reason for rejecting this timesheet (optional)
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full h-32 p-3 border border-gray-200 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={closeRejectModal}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium text-base active:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-medium text-base active:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
