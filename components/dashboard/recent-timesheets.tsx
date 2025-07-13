"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback, useMemo } from "react"
import { getTimesheets } from "@/lib/data/timesheets"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns"
import type { TimesheetWithDetails } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Filter, Download, User, Circle } from "lucide-react"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface RecentTimesheetsProps {
  selectedDate: Date
}

export function RecentTimesheets({ selectedDate }: RecentTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<"month" | "week" | "today">("month")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const { paymentSchedule } = usePayrollSettings()

  const loadRecentTimesheets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await getUserProfileWithCompany()
      if (!profile) {
        setError("No profile found")
        return
      }

      // Get week start day from payment schedule, default to Saturday for construction industry
      const getWeekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
        if (paymentSchedule?.period_start_type === "day_of_week") {
          const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
            1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
          }
          return dayMap[paymentSchedule.period_start_day] || 6
        }
        return 6 // Default to Saturday for construction industry
      }

      // Calculate date range directly within the function
      let start: Date, end: Date
      switch (selectedTimePeriod) {
        case "today":
          start = startOfDay(selectedDate)
          end = endOfDay(selectedDate)
          break
        case "week":
          start = startOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          end = endOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          break
        case "month":
          // Use rolling 30-day window instead of calendar month
          end = endOfDay(selectedDate)
          start = startOfDay(subDays(selectedDate, 29)) // 30 days including today
          break
      }

      const result = await getTimesheets(profile.id, {
        limit: 25, // Show recent 25 timesheets for dashboard overview
        date_from: format(start, 'yyyy-MM-dd'),
        date_to: format(end, 'yyyy-MM-dd')
      })

      if (result.success && result.data) {
        setTimesheets(result.data)
      } else {
        setError(result.error || "Failed to load timesheets")
      }
    } catch (error) {
      console.error('Failed to load recent timesheets:', error)
      setError("Failed to load timesheets")
    } finally {
      setLoading(false)
    }
  }, [selectedDate, paymentSchedule, selectedTimePeriod])

  useEffect(() => {
    loadRecentTimesheets()
  }, [loadRecentTimesheets])

  const getFilteredTimesheets = useCallback((status: string) => {
    if (status === "all") return timesheets
    
    return timesheets.filter(timesheet => {
      const approvalStatus = timesheet.supervisor_approval || "pending"
      return approvalStatus === status
    })
  }, [timesheets])

  const getStatusCount = useCallback((status: string) => {
    if (status === "all") return timesheets.length
    return timesheets.filter(timesheet => {
      const approvalStatus = timesheet.supervisor_approval || "pending"
      return approvalStatus === status
    }).length
  }, [timesheets])

  // Define table columns
  const columns: ColumnDef<TimesheetWithDetails>[] = [
    {
      accessorKey: "worker",
      header: "Worker",
      size: 180,
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{timesheet.worker?.name || "Unknown Worker"}</p>
              <p className="text-xs text-muted-foreground truncate">{timesheet.worker?.position || "Worker"}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "client",
      header: "Client",
      size: 160,
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{timesheet.project?.client?.name || "Unknown Client"}</p>
            <p className="text-xs text-muted-foreground truncate">{timesheet.project?.client?.company || "No company"}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: "Project",
      size: 160,
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="min-w-0">
            <p className="font-medium text-sm truncate text-gray-500">{timesheet.project?.name || "Unknown Project"}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 120,
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="text-sm">
            <p className="font-medium text-gray-500">{format(new Date(timesheet.date), "EEE d MMM")}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "total_hours",
      header: "Hours",
      size: 120,
      cell: ({ row }) => {
        const timesheet = row.original
        return (
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium text-sm text-gray-500">{timesheet.total_hours}h</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "supervisor_approval",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const timesheet = row.original
        const status = timesheet.supervisor_approval || "pending"
        
        const getStatusColor = () => {
          switch (status) {
            case "approved":
              return "text-green-500"
            case "pending":
              return "text-amber-500"
            case "rejected":
              return "text-red-500"
            default:
              return "text-amber-500"
          }
        }
        
        return (
          <div className="flex items-center gap-2">
            <Circle 
              className={`h-2 w-2 fill-current ${getStatusColor()}`} 
              style={status === "pending" ? { color: "#f97316" } : undefined}
            />
            <span className="text-sm text-gray-500">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        )
      },
    },
  ]

  const filteredData = useMemo(() => getFilteredTimesheets(selectedTab), [getFilteredTimesheets, selectedTab])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-7 w-40 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-4 w-60 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-9 flex-1 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            <div className="h-9 w-9 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted-foreground/20 dark:bg-muted/50" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2 text-right">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="font-medium">Recent Timesheets</CardTitle>
        </div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-1 bg-background rounded p-1">
            <button
              onClick={() => setSelectedTab("all")}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                selectedTab === "all" 
                  ? "bg-sidebar text-foreground font-semibold" 
                  : "text-gray-600 hover:text-foreground"
              }`}
            >
              All ({timesheets.length})
            </button>

            <button
              onClick={() => setSelectedTab("pending")}
              className={`
                text-xs px-3 py-1.5 rounded transition-colors ${
                  selectedTab === "pending" 
                    ? "bg-sidebar text-foreground font-semibold" 
                    : "text-gray-600 hover:text-foreground"
                }`}
              >
                Pending ({getStatusCount("pending")})
              </button>
              <button
                onClick={() => setSelectedTab("approved")}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  selectedTab === "approved" 
                    ? "bg-sidebar text-foreground font-semibold" 
                    : "text-gray-600 hover:text-foreground"
                }`}
              >
                Approved ({getStatusCount("approved")})
              </button>
              <button
                onClick={() => setSelectedTab("rejected")}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  selectedTab === "rejected" 
                    ? "bg-sidebar text-foreground font-semibold" 
                    : "text-gray-600 hover:text-foreground"
                }`}
              >
                Rejected ({getStatusCount("rejected")})
              </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setSelectedTimePeriod("month")}
                    className={selectedTimePeriod === "month" ? "bg-accent" : ""}
                  >
                    This Month
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedTimePeriod("week")}
                    className={selectedTimePeriod === "week" ? "bg-accent" : ""}
                  >
                    This Week
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedTimePeriod("today")}
                    className={selectedTimePeriod === "today" ? "bg-accent" : ""}
                  >
                    Today
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <p className="font-medium">Failed to load timesheets</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="font-medium">No timesheets found</p>
              <p className="text-sm mt-1">No timesheets match the selected filter</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="border-b border-border">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="px-4 whitespace-nowrap bg-transparent text-gray-500">
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
                        <TableRow key={row.id} className="hover:bg-muted/50 border-none">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-4 whitespace-nowrap border-none">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-none">
                        <TableCell colSpan={columns.length} className="h-24 text-center px-4 border-none">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>
    )
  }