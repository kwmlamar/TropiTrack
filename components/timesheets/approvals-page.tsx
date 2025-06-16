"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { Check, X, Calendar, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { TimesheetWithDetails } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"
import { User } from "@supabase/supabase-js"

interface ApprovalsPageProps {
  timesheets: TimesheetWithDetails[]
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  user: User
}

export function ApprovalsPage({ timesheets: initialTimesheets, onApprove, onReject, user }: ApprovalsPageProps) {
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>(initialTimesheets)
  const { paymentSchedule } = usePayrollSettings()

  // Update timesheets when initialTimesheets changes
  useEffect(() => {
    setTimesheets(initialTimesheets)
  }, [initialTimesheets])

  const pendingTimesheets = timesheets.filter(
    (ts) => ts.supervisor_approval === "pending"
  )

  // Get week start day from payroll settings
  const weekStartDay = paymentSchedule?.period_start_type === "day_of_week" 
    ? (paymentSchedule.period_start_day) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    : 1 // Default to Monday if not set

  // Group timesheets by worker and pay period
  const groupedTimesheets = pendingTimesheets.reduce((acc, timesheet) => {
    const timesheetDate = parseISO(timesheet.date)
    const periodStart = startOfWeek(timesheetDate, { weekStartsOn: weekStartDay })
    const periodEnd = endOfWeek(timesheetDate, { weekStartsOn: weekStartDay })
    const periodKey = format(periodStart, "yyyy-MM-dd")
    const workerId = timesheet.worker_id

    if (!acc[workerId]) {
      acc[workerId] = {}
    }
    if (!acc[workerId][periodKey]) {
      acc[workerId][periodKey] = {
        timesheets: [],
        periodStart,
        periodEnd
      }
    }
    acc[workerId][periodKey].timesheets.push(timesheet)
    return acc
  }, {} as Record<string, Record<string, {
    timesheets: TimesheetWithDetails[],
    periodStart: Date,
    periodEnd: Date
  }>>)

  const handleApprove = async (id: string) => {
    try {
      setIsProcessing(true)
      await onApprove(id)
      
      // Generate payroll for the approved timesheet
      const approvedTimesheet = pendingTimesheets.find(ts => ts.id === id)
      if (approvedTimesheet) {
        const weekStart = format(startOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
        await generatePayrollForWorkerAndPeriod(user.id, approvedTimesheet.worker_id, weekStart, weekEnd)
      }
      
      // Update local state
      const updatedTimesheets = timesheets.map(ts => 
        ts.id === id ? { ...ts, supervisor_approval: "approved" as const } : ts
      )
      setTimesheets(updatedTimesheets)
      
      toast.success("Timesheet approved and payroll generated")
    } catch (error) {
      console.error('Error in approval process:', error)
      toast.error("Failed to approve timesheet or generate payroll")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setIsProcessing(true)
      await onReject(id)
      toast.success("Timesheet rejected")
    } catch (error) {
      console.error('Error rejecting timesheet:', error)
      toast.error("Failed to reject timesheet")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchApprove = async (timesheetIds: string[]) => {
    if (!timesheetIds.length) return
    
    setIsProcessing(true)
    try {
      // First approve all timesheets
      await Promise.all(timesheetIds.map(id => onApprove(id)))
      
      // Then generate payroll for each affected worker and period
      const affectedWorkersAndWeeks = new Map<string, { workerId: string, weekStart: string, weekEnd: string }>()
      
      timesheetIds.forEach(id => {
        const ts = pendingTimesheets.find(t => t.id === id)
        if (ts) {
          const weekStart = format(startOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
          const weekEnd = format(endOfWeek(parseISO(ts.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
          const key = `${ts.worker_id}-${weekStart}`
          if (!affectedWorkersAndWeeks.has(key)) {
            affectedWorkersAndWeeks.set(key, { workerId: ts.worker_id, weekStart, weekEnd })
          }
        }
      })

      // Generate payroll for each unique worker-week combination
      for (const { workerId, weekStart, weekEnd } of affectedWorkersAndWeeks.values()) {
        await generatePayrollForWorkerAndPeriod(user.id, workerId, weekStart, weekEnd)
      }
      
      // Update local state
      const updatedTimesheets = timesheets.map(ts => 
        timesheetIds.includes(ts.id) ? { ...ts, supervisor_approval: "approved" as const } : ts
      )
      setTimesheets(updatedTimesheets)
      
      // Clear selection
      setSelectedTimesheetIds(new Set())
      
      toast.success(`Approved ${timesheetIds.length} timesheet${timesheetIds.length === 1 ? '' : 's'} and generated payroll`)
    } catch (error) {
      console.error('Error in approval process:', error)
      toast.error("Failed to approve timesheets or generate payroll. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectAll = (checked: boolean, workerId?: string) => {
    if (checked) {
      const timesheetsToSelect = workerId
        ? pendingTimesheets.filter(ts => ts.worker_id === workerId)
        : pendingTimesheets
      const newSelection = new Set(selectedTimesheetIds)
      timesheetsToSelect.forEach(ts => newSelection.add(ts.id))
      setSelectedTimesheetIds(newSelection)
    } else {
      if (workerId) {
        // Only deselect timesheets for this worker
        const newSelection = new Set(selectedTimesheetIds)
        pendingTimesheets
          .filter(ts => ts.worker_id === workerId)
          .forEach(ts => newSelection.delete(ts.id))
        setSelectedTimesheetIds(newSelection)
      } else {
        // Deselect all timesheets
        setSelectedTimesheetIds(new Set())
      }
    }
  }

  const handleSelectTimesheet = (id: string, checked: boolean) => {
    setSelectedTimesheetIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pending Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve timesheet entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("daily")}
              className="rounded-md"
            >
              Daily View
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="rounded-md"
            >
              Weekly View
            </Button>
          </div>
          {pendingTimesheets.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleSelectAll(selectedTimesheetIds.size === pendingTimesheets.length ? false : true)}
              disabled={isProcessing}
            >
              {selectedTimesheetIds.size === pendingTimesheets.length ? "Deselect All" : "Select All"}
            </Button>
          )}
          <Button
            onClick={() => handleBatchApprove(Array.from(selectedTimesheetIds))}
            disabled={isProcessing || selectedTimesheetIds.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve Selected {selectedTimesheetIds.size > 0 && `(${selectedTimesheetIds.size})`}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timesheet Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTimesheets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No pending timesheets to approve
            </div>
          ) : viewMode === "weekly" ? (
            <div className="space-y-6">
              {Object.entries(groupedTimesheets).map(([workerId, periods]) => {
                const worker = pendingTimesheets.find(ts => ts.worker_id === workerId)?.worker
                return (
                  <div key={workerId} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <h3 className="font-semibold">{worker?.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {worker?.position}
                      </span>
                    </div>
                    {Object.entries(periods).map(([periodKey, { timesheets, periodStart, periodEnd }]) => {
                      const totalHours = timesheets.reduce((sum, ts) => sum + ts.total_hours, 0)
                      const overtimeHours = timesheets.reduce((sum, ts) => sum + ts.overtime_hours, 0)
                      const isAllSelected = timesheets.every(ts => selectedTimesheetIds.has(ts.id))

                      return (
                        <Card key={periodKey} className="border-muted">
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                  Pay Period: {format(periodStart, "MMM d")} - {format(periodEnd, "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="font-medium">{totalHours}h</span>
                                  {overtimeHours > 0 && (
                                    <span className="text-orange-600 ml-2">+{overtimeHours}h OT</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked: boolean) => handleSelectAll(checked, worker?.id)}
                                    aria-label="Select all timesheets for this worker"
                                    disabled={isProcessing}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Project</TableHead>
                                  <TableHead>Hours</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {timesheets.map((timesheet) => (
                                  <TableRow key={timesheet.id}>
                                    <TableCell>
                                      {format(parseISO(timesheet.date), "EEE, MMM d")}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{timesheet.project?.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {timesheet.project?.location}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{timesheet.total_hours}h</div>
                                      {timesheet.overtime_hours > 0 && (
                                        <div className="text-sm text-orange-600">
                                          +{timesheet.overtime_hours}h OT
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Checkbox
                                          checked={selectedTimesheetIds.has(timesheet.id)}
                                          onCheckedChange={(checked) => 
                                            handleSelectTimesheet(timesheet.id, checked as boolean)
                                          }
                                          aria-label="Select timesheet"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleReject(timesheet.id)}
                                          disabled={isProcessing}
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Reject
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprove(timesheet.id)}
                                          disabled={isProcessing}
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTimesheetIds.size === pendingTimesheets.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all timesheets"
                    />
                  </TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTimesheetIds.has(timesheet.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTimesheet(timesheet.id, checked as boolean)
                        }
                        aria-label="Select timesheet"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{timesheet.worker?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {timesheet.worker?.position}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(timesheet.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{timesheet.project?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {timesheet.project?.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{timesheet.total_hours}h</div>
                      {timesheet.overtime_hours > 0 && (
                        <div className="text-sm text-orange-600">
                          +{timesheet.overtime_hours}h OT
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(timesheet.id)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(timesheet.id)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 