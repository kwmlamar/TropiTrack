"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Check, X, Clock, User, Building2, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
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
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  useEffect(() => {
    fetchUnapprovedTimesheets()
  }, [])

  const fetchUnapprovedTimesheets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/approvals')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unapproved timesheets')
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch unapproved timesheets')
      }
      
      setTimesheets(result.data || [])
    } catch (err) {
      console.error('Error fetching unapproved timesheets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch unapproved timesheets')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (timesheetId: string) => {
    try {
      setApproving(timesheetId)
      
      const response = await fetch(`/api/approvals/${timesheetId}/approve`, {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve timesheet')
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to approve timesheet')
      }
      
      toast.success('Timesheet approved successfully')
      // Remove the approved timesheet from the list
      setTimesheets(prev => prev.filter(t => t.id !== timesheetId))
    } catch (err) {
      console.error('Error approving timesheet:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to approve timesheet')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (timesheetId: string) => {
    try {
      setRejecting(timesheetId)
      
      const response = await fetch(`/api/approvals/${timesheetId}/reject`, {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reject timesheet')
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to reject timesheet')
      }
      
      toast.success('Timesheet rejected successfully')
      // Remove the rejected timesheet from the list
      setTimesheets(prev => prev.filter(t => t.id !== timesheetId))
    } catch (err) {
      console.error('Error rejecting timesheet:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to reject timesheet')
    } finally {
      setRejecting(null)
    }
  }

  const columns: ColumnDef<TimesheetWithDetails>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="!border-2 !border-border !bg-background hover:!bg-accent hover:!text-accent-foreground !focus-visible:ring-0 !focus-visible:ring-offset-0 data-[state=checked]:!bg-primary data-[state=checked]:!text-white !shadow-none hover:!shadow-sm data-[state=checked]:!shadow-sm"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="!border-2 !border-border !bg-background hover:!bg-accent hover:!text-accent-foreground !focus-visible:ring-0 !focus-visible:ring-offset-0 data-[state=checked]:!bg-primary data-[state=checked]:!text-white !shadow-none hover:!shadow-sm data-[state=checked]:!shadow-sm"
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
            <User className="h-4 w-4 text-muted-foreground" />
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
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{timesheet.project?.name || 'Unknown Project'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(timesheet.date), 'MMM d, yyyy')}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="space-y-1">
            <p className="font-medium">{timesheet.total_hours}h</p>
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
          <span>${timesheet.total_pay.toFixed(2)}</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => {
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
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
              disabled={rejecting === timesheet.id}
              className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
            >
              {rejecting === timesheet.id ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleApprove(timesheet.id)}
              disabled={approving === timesheet.id}
              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              {approving === timesheet.id ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check className="h-3 w-3 text-primary" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  const [rowSelection, setRowSelection] = useState({})

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
        <div>
          <h2 className="text-lg font-medium mb-2">Pending Approvals</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
            </div>
          </CardContent>
        </Card>
          ))}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium mb-2">Pending Approvals</h2>
          <p className="text-sm text-gray-500">
            {timesheets.length} timesheet{timesheets.length !== 1 ? 's' : ''} pending approval
          </p>
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
              className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
              onClick={async () => {
                const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.id)
                setApproving('bulk')
                try {
                  for (const id of selectedIds) {
                    await handleApprove(id)
                  }
                } finally {
                  setApproving(null)
                }
              }}
              disabled={Object.keys(rowSelection).length === 0 || approving === 'bulk'}
            >
              Approve Selected
            </Button>
          )}
        </div>
      </div>

      {timesheets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No unapproved timesheets</h3>
            <p className="text-muted-foreground">
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
                      <TableHead key={header.id} className="px-4">
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