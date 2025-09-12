"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { Check, X, Clock, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/utils/supabase/client"

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
  supervisor_approval: "pending" | "approved" | "rejected"
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

export function ApprovalsPage() {
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rowSelection, setRowSelection] = useState({});
  const [user, setUser] = useState<{ id: string } | null>(null)
  const weekStartDay = 6 // Saturday

  useEffect(() => {
    console.log('[Approvals] Component mounted, fetching data...')
    fetchUnapprovedTimesheets()
    // Get current user
    const getUser = async () => {
      try {
        console.log('[Approvals] Fetching user data...')
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('[Approvals] Auth error:', authError)
          return
        }
        
        if (authUser) {
          console.log('[Approvals] User data fetched:', authUser)
          setUser(authUser)
        } else {
          console.error('[Approvals] No user found')
        }
      } catch (error) {
        console.error('[Approvals] Error fetching user:', error)
      }
    }
    getUser()
  }, [])

  const fetchUnapprovedTimesheets = async () => {
    try {
      console.log('[Approvals] Fetching unapproved timesheets...')
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/approvals')
      console.log('[Approvals] API response status:', response.status)
      const result = await response.json()
      console.log('[Approvals] API response result:', result)
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unapproved timesheets')
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch unapproved timesheets')
      }
      
      console.log('[Approvals] Setting timesheets:', result.data?.length || 0, 'timesheets')
      setTimesheets(result.data || [])
    } catch (err) {
      console.error('[Approvals] Error fetching unapproved timesheets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch unapproved timesheets')
    } finally {
      setLoading(false)
    }
  }

  const onApprove = async (id: string) => {
    const response = await fetch(`/api/approvals/${id}/approve`, {
      method: 'POST',
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to approve timesheet')
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to approve timesheet')
    }
    
    return result
  }

  const onReject = async (id: string) => {
    const response = await fetch(`/api/approvals/${id}/reject`, {
      method: 'POST',
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to reject timesheet')
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to reject timesheet')
    }
    
    return result
  }

  const generatePayrollForWorkerAndPeriod = async (userId: string | null, workerId: string, weekStart: string, weekEnd: string) => {
    console.log(`[Approvals] Calling generatePayrollForWorkerAndPeriod with:`, {
      userId,
      workerId,
      weekStart,
      weekEnd
    })
    
    const response = await fetch('/api/generate-payroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workerId,
        weekStart,
        weekEnd,
        userId
      })
    })
    
    console.log(`[Approvals] API response status:`, response.status)
    const result = await response.json()
    console.log(`[Approvals] API response result:`, result)
    
    if (!response.ok) {
      console.error(`[Approvals] API error:`, result)
      throw new Error(result.message || 'Failed to generate payroll')
    }
    
    if (!result.success) {
      console.error(`[Approvals] API returned success: false:`, result)
      throw new Error(result.message || 'Failed to generate payroll')
    }
    
    console.log(`[Approvals] Payroll generation successful:`, result)
    return result
  }

  const handleApprove = async (id: string) => {
    try {
      console.log(`[Approvals] Starting approval for timesheet ${id}`)
      setIsProcessing(true)
      
      console.log(`[Approvals] Calling onApprove for timesheet ${id}`)
      await onApprove(id)
      console.log(`[Approvals] Timesheet ${id} approved successfully`)
      
      // Generate payroll for the approved timesheet
      const approvedTimesheet = timesheets.find(ts => ts.id === id)
      if (approvedTimesheet && user?.id) {
        console.log(`[Approvals] Found approved timesheet:`, approvedTimesheet)
        const weekStart = format(startOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(parseISO(approvedTimesheet.date), { weekStartsOn: weekStartDay }), 'yyyy-MM-dd')
        console.log(`[Approvals] Calculating pay period: ${weekStart} to ${weekEnd}`)
        console.log(`[Approvals] User ID: ${user.id}, Worker ID: ${approvedTimesheet.worker_id}`)
        
        console.log(`[Approvals] Calling generatePayrollForWorkerAndPeriod...`)
        const result = await generatePayrollForWorkerAndPeriod(user.id, approvedTimesheet.worker_id, weekStart, weekEnd)
        console.log(`[Approvals] Payroll generation result:`, result)
        
        if (!result.success) {
          console.error(`[Approvals] Payroll generation failed:`, result.error)
          toast.error(`Timesheet approved but payroll generation failed: ${result.error}`)
        } else {
          console.log(`[Approvals] Payroll generated successfully:`, result.data)
          toast.success("Timesheet approved and payroll generated")
        }
      } else {
        console.error(`[Approvals] Could not find approved timesheet with ID ${id} or user is null`)
        toast.error("Timesheet approved but could not find timesheet data for payroll generation")
      }
      
      // Refresh the data to load new unapproved timesheets
      await fetchUnapprovedTimesheets()
      
    } catch (error) {
      console.error('[Approvals] Error in approval process:', error)
      toast.error("Failed to approve timesheet or generate payroll")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setIsProcessing(true)
      await onReject(id)
      
      // Refresh the data to load new unapproved timesheets
      await fetchUnapprovedTimesheets()
      
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
        const ts = timesheets.find(t => t.id === id)
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
      if (user?.id) {
        console.log(`[Approvals] Generating payroll for ${affectedWorkersAndWeeks.size} worker-week combinations`)
        for (const { workerId, weekStart, weekEnd } of affectedWorkersAndWeeks.values()) {
          console.log(`[Approvals] Generating payroll for worker ${workerId}, period ${weekStart} to ${weekEnd}`)
          const result = await generatePayrollForWorkerAndPeriod(user.id, workerId, weekStart, weekEnd)
          console.log(`[Approvals] Payroll generation result:`, result)
          if (!result.success) {
            console.error(`[Approvals] Failed to generate payroll for worker ${workerId}:`, result.error)
          } else {
            console.log(`[Approvals] Successfully generated payroll for worker ${workerId}`)
          }
        }
      }

      // Update local state
      const updatedTimesheets = timesheets.map(ts => 
        timesheetIds.includes(ts.id) ? { ...ts, supervisor_approval: "approved" as const } : ts
      )
      setTimesheets(updatedTimesheets)
      
      // Clear selection
      setRowSelection({})
      
      toast.success(`Approved ${timesheetIds.length} timesheets and generated payroll`)
      
      // Refresh the data to load new unapproved timesheets
      await fetchUnapprovedTimesheets()
    } catch (error) {
      console.error('Error in batch approval process:', error)
      toast.error("Failed to approve timesheets or generate payroll")
    } finally {
      setIsProcessing(false)
    }
  }

  const columns: ColumnDef<TimesheetWithDetails>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          color="var(--muted-foreground)"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          color="var(--muted-foreground)"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "worker",
      header: "Worker",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-medium">{timesheet.worker?.name || 'Unknown Worker'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <span className="text-gray-500">{timesheet.project?.name || 'Unknown Project'}</span>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <span className="text-gray-500">{format(new Date(timesheet.date), 'MMM d, yyyy')}</span>
        )
      },
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div>
            <p className="text-sm text-gray-500">
              {timesheet.regular_hours}h regular, {timesheet.overtime_hours}h overtime
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: "pay",
      header: "Pay",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <span className="text-gray-500">${timesheet.total_pay.toFixed(2)}</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => {
        return (
          <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30 dark:bg-orange-500/20 dark:text-orange-500 dark:border-orange-500/30 dark:hover:bg-orange-500/30 px-3 py-1 text-xs font-medium rounded-2xl">
            Pending
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="flex items-center gap-3 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(timesheet.id)}
              disabled={isProcessing}
              className="h-8 w-8 p-0 bg-sidebar border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
            >
              {isProcessing ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApprove(timesheet.id)}
              disabled={isProcessing}
              className="h-8 w-8 p-0 bg-sidebar border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
            >
              {isProcessing ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: timesheets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  if (loading) {
    return (
      <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="flex items-center space-x-6">
              <div className="h-9 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-9 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="rounded-md border bg-sidebar">
            <div className="border-b">
              <div className="grid grid-cols-7 gap-4 p-4">
                <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              </div>
            </div>
            
            {/* Table Rows Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b last:border-b-0">
                <div className="grid grid-cols-7 gap-4 p-4">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-muted-foreground/20 dark:bg-muted/50 rounded-full animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="h-6 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-8 w-8 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-8 w-8 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Pending Approvals</h2>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Pending Approvals</h2>
          <span className="text-sm text-gray-500">
            ({timesheets.length} timesheet{timesheets.length !== 1 ? 's' : ''} pending approval)
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {timesheets.length > 0 && (
            <Button
              variant="outline"
              onClick={fetchUnapprovedTimesheets}
              disabled={loading}
              className="border border-muted-foreground m-0"
            >
              Refresh
            </Button>
          )}
          {timesheets.length > 0 && (
            <Button
              onClick={async () => {
                const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.id)
                await handleBatchApprove(selectedIds)
              }}
              disabled={table.getSelectedRowModel().rows.length === 0 || isProcessing}
              className="ml-2"
            >
              Approve Selected
            </Button>
          )}
        </div>
      </div>

      {timesheets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No unapproved timesheets</h3>
            <p className="text-gray-500">
              All timesheets have been approved or there are no pending submissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 text-gray-500">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center px-4">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 