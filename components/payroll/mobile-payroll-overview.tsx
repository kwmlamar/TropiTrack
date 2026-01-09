"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { updatePayrollStatus } from "@/lib/data/payroll"
import type { PayrollRecord } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MobilePayrollOverviewProps {
  companyId: string
}

export function MobilePayrollOverview({ companyId }: MobilePayrollOverviewProps) {
  const router = useRouter()
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)

  // Current pay period (week) - Saturday to Friday
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date()
    return startOfWeek(now, { weekStartsOn: 6 }) // Saturday
  })

  const periodEnd = useMemo(() => endOfWeek(periodStart, { weekStartsOn: 6 }), [periodStart])

  useEffect(() => {
    loadPayrolls()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodStart])

  const loadPayrolls = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      if (!companyId) {
        console.error("No companyId provided")
        toast.error("Company ID not found")
        setLoading(false)
        return
      }

      const dateFrom = format(periodStart, "yyyy-MM-dd")
      const dateTo = format(periodEnd, "yyyy-MM-dd")
      
      console.log("Loading payrolls:", { companyId, dateFrom, dateTo })

      // Query payroll data - use overlap logic: payroll period overlaps with selected period
      // A payroll period overlaps if: pay_period_start <= periodEnd AND pay_period_end >= periodStart
      const { data, error } = await supabase
        .from("payroll")
        .select(`
          id, 
          worker_id, 
          worker_name, 
          project_id,
          total_hours, 
          overtime_hours, 
          hourly_rate, 
          gross_pay, 
          nib_deduction, 
          other_deductions, 
          total_deductions, 
          net_pay, 
          position, 
          department, 
          status, 
          company_id, 
          created_at, 
          updated_at, 
          pay_period_start, 
          pay_period_end,
          worker:worker_id(id, name, hourly_rate, position, department),
          projects!project_id(id, name)
        `)
        .eq("company_id", companyId)
        .lte("pay_period_start", dateTo) // pay_period_start <= periodEnd
        .gte("pay_period_end", dateFrom) // pay_period_end >= periodStart
        .order("pay_period_start", { ascending: false })

      console.log("Payroll query result:", { dataCount: data?.length || 0, error })

      if (error) {
        console.error("Error loading payrolls:", error)
        toast.error(`Failed to load payroll data: ${error.message}`)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        console.log("Raw payroll data:", data)
        
        // Type for Supabase query result with relations
        type PayrollQueryResult = {
          id: string
          worker_id: string
          worker_name: string
          project_id: string | null
          total_hours: number | null
          overtime_hours: number | null
          hourly_rate: number | null
          gross_pay: number | null
          nib_deduction: number | null
          other_deductions: number | null
          total_deductions: number | null
          net_pay: number | null
          position: string | null
          department: string | null
          status: string
          company_id: string
          created_at: string
          updated_at: string
          pay_period_start: string
          pay_period_end: string
          worker: Array<{ id: string; name: string; hourly_rate: number | null; position: string | null; department: string | null }> | { id: string; name: string; hourly_rate: number | null; position: string | null; department: string | null } | null
          projects: Array<{ id: string; name: string }> | { id: string; name: string } | null
        }
        
        // Map the data to PayrollRecord format
        const mappedPayrolls: PayrollRecord[] = data.map((item: PayrollQueryResult) => {
          const workerInfo = Array.isArray(item.worker) && item.worker.length > 0 
            ? item.worker[0] 
            : (item.worker || {})
          const projectInfo = Array.isArray(item.projects) && item.projects.length > 0
            ? item.projects[0]
            : (item.projects || {})

          return {
            id: item.id,
            worker_id: item.worker_id,
            worker_name: workerInfo?.name || item.worker_name || "",
            project_id: item.project_id,
            project_name: projectInfo?.name || "",
            total_hours: item.total_hours || 0,
            overtime_hours: item.overtime_hours || 0,
            hourly_rate: item.hourly_rate || 0,
            gross_pay: item.gross_pay || 0,
            nib_deduction: item.nib_deduction || 0,
            other_deductions: item.other_deductions || 0,
            total_deductions: item.total_deductions || 0,
            net_pay: item.net_pay || 0,
            position: item.position || workerInfo?.position || "",
            department: item.department || workerInfo?.department || "",
            status: item.status || "pending",
            company_id: item.company_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            pay_period_start: item.pay_period_start,
            pay_period_end: item.pay_period_end,
          }
        })

        console.log("Mapped payrolls:", mappedPayrolls)

        // Deduplicate payroll records by worker_id and pay period
        const payrollMap = new Map<string, PayrollRecord>()
        mappedPayrolls.forEach((payroll) => {
          const key = `${payroll.worker_id}-${payroll.pay_period_start}-${payroll.pay_period_end}`
          const existing = payrollMap.get(key)
          
          if (!existing) {
            payrollMap.set(key, payroll)
          } else {
            const existingDate = new Date(existing.updated_at || existing.created_at || 0)
            const currentDate = new Date(payroll.updated_at || payroll.created_at || 0)
            
            if (currentDate > existingDate) {
              payrollMap.set(key, payroll)
            }
          }
        })

        const finalPayrolls = Array.from(payrollMap.values())
        console.log("Final payrolls after deduplication:", finalPayrolls)
        setPayrolls(finalPayrolls)
      } else {
        console.log("No payroll data found for this period")
        setPayrolls([])
      }
    } catch (error) {
      console.error("Error loading payrolls:", error)
      toast.error("Failed to load payroll data")
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousWeek = () => {
    setPeriodStart(subWeeks(periodStart, 1))
  }

  const handleNextWeek = () => {
    setPeriodStart(addWeeks(periodStart, 1))
  }

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalHours = payrolls.reduce((sum, p) => sum + (p.total_hours || 0), 0)
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.net_pay || 0), 0)
    const workerCount = new Set(payrolls.map((p) => p.worker_id)).size

    return { totalHours, totalPayroll, workerCount }
  }, [payrolls])

  // Group payrolls by worker (aggregate if multiple entries for same worker)
  const workerPayrolls = useMemo(() => {
    const workerMap = new Map<
      string,
      {
        worker_id: string
        worker_name: string
        position?: string
        total_hours: number
        overtime_hours: number
        net_pay: number
        status: PayrollRecord["status"]
        payroll_ids: string[]
      }
    >()

    payrolls.forEach((p) => {
      const existing = workerMap.get(p.worker_id)
      if (existing) {
        existing.total_hours += p.total_hours || 0
        existing.overtime_hours += p.overtime_hours || 0
        existing.net_pay += p.net_pay || 0
        existing.payroll_ids.push(p.id)
        // Use most restrictive status
        if (p.status === "pending") existing.status = "pending"
      } else {
        workerMap.set(p.worker_id, {
          worker_id: p.worker_id,
          worker_name: p.worker_name,
          position: p.position,
          total_hours: p.total_hours || 0,
          overtime_hours: p.overtime_hours || 0,
          net_pay: p.net_pay || 0,
          status: p.status,
          payroll_ids: [p.id],
        })
      }
    })

    return Array.from(workerMap.values()).sort((a, b) =>
      a.worker_name.localeCompare(b.worker_name)
    )
  }, [payrolls])

  // Check if any payrolls can be finalized
  const pendingPayrolls = payrolls.filter((p) => p.status === "pending")
  const canFinalize = pendingPayrolls.length > 0

  const handleFinalizePayroll = async () => {
    if (pendingPayrolls.length === 0) return

    setFinalizing(true)
    try {
      // Update all pending payrolls to paid
      const payrollIds = pendingPayrolls.map((p) => p.id)
      await updatePayrollStatus(payrollIds, "paid")

      toast.success(`${pendingPayrolls.length} payroll records marked as paid`)
      setShowFinalizeDialog(false)
      loadPayrolls()
    } catch (error) {
      console.error("Error marking payroll as paid:", error)
      toast.error("Failed to mark payroll as paid")
    } finally {
      setFinalizing(false)
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

  const getStatusBadge = (status: PayrollRecord["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0">
            Paid
          </Badge>
        )
      case "confirmed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-2 py-0">
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs px-2 py-0">
            Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-0 text-xs px-2 py-0">
            {status}
          </Badge>
        )
    }
  }

  const handleWorkerClick = (workerId: string, payrollIds: string[]) => {
    // Navigate to worker payroll breakdown
    const params = new URLSearchParams({
      worker: workerId,
      start: format(periodStart, "yyyy-MM-dd"),
      end: format(periodEnd, "yyyy-MM-dd"),
      ids: payrollIds.join(","),
    })
    router.push(`/dashboard/payroll/breakdown?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
            Payroll
          </h1>
        </div>
      </div>

      {/* Pay Period Selector */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <p className="text-base font-medium text-gray-900">
              {format(periodStart, "MMM d")} - {format(periodEnd, "MMM d, yyyy")}
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading payroll...</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="px-4 pt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  ${summary.totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Payroll</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.totalHours.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">Total Hours</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.workerCount}
                  </p>
                  <p className="text-xs text-gray-500">Workers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workers List */}
          <div className="px-4 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Workers
              </h3>
              {workerPayrolls.length > 0 && (
                <span className="text-xs text-gray-400">
                  {workerPayrolls.length} worker{workerPayrolls.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {workerPayrolls.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  No payroll records
                </h4>
                <p className="text-sm text-gray-500">
                  No payroll data for this period
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workerPayrolls.map((wp) => (
                  <button
                    key={wp.worker_id}
                    onClick={() => handleWorkerClick(wp.worker_id, wp.payroll_ids)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarFallback className="bg-[#2596be] text-white text-sm font-semibold">
                        {getInitials(wp.worker_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {wp.worker_name}
                        </p>
                        {wp.overtime_hours > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 border-0 text-xs px-1.5 py-0">
                            OT
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-500">
                          {wp.total_hours.toFixed(1)} hrs
                        </span>
                        <span className="text-gray-300">·</span>
                        {getStatusBadge(wp.status)}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-semibold text-gray-900">
                        ${wp.net_pay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pay Workers CTA */}
          {workerPayrolls.length > 0 && (
            <div className="px-4 pt-6 pb-4">
              <button
                onClick={() => setShowFinalizeDialog(true)}
                disabled={!canFinalize}
                className={`w-full flex items-center justify-center gap-2 h-12 font-semibold rounded-xl transition-all active:scale-[0.98] ${
                  canFinalize
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {canFinalize
                  ? `Pay workers (${pendingPayrolls.length})`
                  : "All workers paid"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Pay Workers Confirmation Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent className="mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Pay workers?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <p className="mb-4">
                Mark all payroll as paid for{" "}
                <span className="font-medium">
                  {format(periodStart, "MMM d")} - {format(periodEnd, "MMM d, yyyy")}
                </span>
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Workers</span>
                  <span className="font-medium text-gray-900">{summary.workerCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Hours</span>
                  <span className="font-medium text-gray-900">
                    {summary.totalHours.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Payroll</span>
                  <span className="font-medium text-gray-900">
                    ${summary.totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizePayroll}
              disabled={finalizing}
              className="flex-1 m-0 bg-green-600 hover:bg-green-700"
            >
              {finalizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay workers"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
