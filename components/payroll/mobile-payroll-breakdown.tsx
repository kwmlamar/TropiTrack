"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  Clock,
  Building2,
  Plus,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { getTimesheets } from "@/lib/data/timesheets"
import { getWorker } from "@/lib/data/workers"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { createClient } from "@/utils/supabase/client"
import type { TimesheetWithDetails } from "@/lib/types"
import type { WorkerWithDetails } from "@/lib/types/worker"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"

interface Adjustment {
  id: string
  type: "bonus" | "deduction" | "reimbursement" | "other"
  amount: number
  note?: string
}

export function MobilePayrollBreakdown() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const workerId = searchParams.get("worker")
  const periodStart = searchParams.get("start")
  const periodEnd = searchParams.get("end")

  const [worker, setWorker] = useState<WorkerWithDetails | null>(null)
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [newAdjustment, setNewAdjustment] = useState({
    type: "bonus" as Adjustment["type"],
    amount: "",
    note: "",
  })

  useEffect(() => {
    if (workerId && periodStart && periodEnd) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, periodStart, periodEnd])

  const loadData = async () => {
    if (!workerId || !periodStart || !periodEnd) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const profile = await getUserProfileWithCompany()
      if (!profile?.company_id) return

      // Load worker details
      const workerResult = await getWorker(profile.company_id, workerId)
      if (workerResult.success && workerResult.data) {
        setWorker(workerResult.data)
      }

      // Load timesheets for the period
      const timesheetsResult = await getTimesheets(user.id, {
        worker_id: workerId,
        date_from: periodStart,
        date_to: periodEnd,
        limit: 100,
      })

      if (timesheetsResult.success && timesheetsResult.data) {
        // Sort by date descending
        const sorted = timesheetsResult.data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setTimesheets(sorted)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate earnings
  const earnings = useMemo(() => {
    if (!worker) return { regular: 0, overtime: 0, total: 0, regularHours: 0, overtimeHours: 0, adjustmentTotal: 0 }

    const regularHours = timesheets.reduce((sum, ts) => sum + (ts.regular_hours || 0), 0)
    const overtimeHours = timesheets.reduce((sum, ts) => sum + (ts.overtime_hours || 0), 0)

    const regularRate = worker.hourly_rate || 0
    const overtimeRate = worker.overtime_rate || regularRate * 1.5

    const regularPay = regularHours * regularRate
    const overtimePay = overtimeHours * overtimeRate

    // Calculate adjustments
    const adjustmentTotal = adjustments.reduce((sum, adj) => {
      const amount = adj.amount || 0
      if (adj.type === "deduction") return sum - amount
      return sum + amount
    }, 0)

    return {
      regular: regularPay,
      overtime: overtimePay,
      total: regularPay + overtimePay + adjustmentTotal,
      regularHours,
      overtimeHours,
      adjustmentTotal,
    }
  }, [worker, timesheets, adjustments])

  // Group timesheets by date
  const dailyBreakdown = useMemo(() => {
    const grouped = new Map<string, TimesheetWithDetails[]>()

    timesheets.forEach((ts) => {
      const date = ts.date
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(ts)
    })

    return Array.from(grouped.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, entries]) => ({
        date,
        entries,
        totalHours: entries.reduce((sum, e) => sum + (e.total_hours || 0), 0),
      }))
  }, [timesheets])

  const handleAddAdjustment = () => {
    const amount = parseFloat(newAdjustment.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const adjustment: Adjustment = {
      id: Date.now().toString(),
      type: newAdjustment.type,
      amount,
      note: newAdjustment.note || undefined,
    }

    setAdjustments([...adjustments, adjustment])
    setShowAdjustmentModal(false)
    setNewAdjustment({ type: "bonus", amount: "", note: "" })
    toast.success("Adjustment added")
  }

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments(adjustments.filter((a) => a.id !== id))
    toast.success("Adjustment removed")
  }

  if (!workerId || !periodStart || !periodEnd) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Invalid parameters</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading breakdown...</p>
        </div>
      </div>
    )
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
          <div className="flex-1 text-center pr-8">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {worker?.name || "Worker"}
            </h1>
            <p className="text-xs text-gray-500">
              {format(parseISO(periodStart), "MMM d")} -{" "}
              {format(parseISO(periodEnd), "MMM d")}
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="px-4 pt-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-gray-900">
              ${earnings.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Earnings</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Regular: {earnings.regularHours.toFixed(1)} hrs × ${worker?.hourly_rate || 0}
              </span>
              <span className="font-medium text-gray-900">
                ${earnings.regular.toFixed(2)}
              </span>
            </div>
            {earnings.overtimeHours > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Overtime: {earnings.overtimeHours.toFixed(1)} hrs ×{" "}
                  ${(worker?.overtime_rate || (worker?.hourly_rate || 0) * 1.5).toFixed(2)}
                </span>
                <span className="font-medium text-gray-900">
                  ${earnings.overtime.toFixed(2)}
                </span>
              </div>
            )}
            {adjustments.length > 0 && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500">Adjustments</span>
                <span
                  className={`font-medium ${
                    earnings.adjustmentTotal >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {earnings.adjustmentTotal >= 0 ? "+" : ""}$
                  {Math.abs(earnings.adjustmentTotal).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="px-4 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Daily Breakdown
        </h3>

        {dailyBreakdown.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No time entries for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyBreakdown.map(({ date, entries, totalHours }) => (
              <div
                key={date}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {format(parseISO(date), "EEE, MMM d")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {totalHours.toFixed(1)} hrs
                  </p>
                </div>
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="flex items-center gap-3 text-sm text-gray-500"
                  >
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate flex-1">
                      {entry.project?.name || "Unknown Project"}
                    </span>
                    <span className="flex-shrink-0">{entry.total_hours} hrs</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjustments Section */}
      <div className="px-4 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Adjustments
        </h3>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {adjustments.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No adjustments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {adjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {adj.type}
                    </p>
                    {adj.note && (
                      <p className="text-xs text-gray-500">{adj.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        adj.type === "deduction" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {adj.type === "deduction" ? "-" : "+"}${adj.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveAdjustment(adj.id)}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="w-full p-4 flex items-center justify-center gap-2 text-sm font-medium text-[#2596be] border-t border-gray-100 active:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Adjustment
          </button>
        </div>
      </div>

      {/* Add Adjustment Modal */}
      <Sheet open={showAdjustmentModal} onOpenChange={setShowAdjustmentModal}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold text-center">
              Add Adjustment
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type
              </label>
              <Select
                value={newAdjustment.type}
                onValueChange={(value) =>
                  setNewAdjustment({ ...newAdjustment, type: value as Adjustment["type"] })
                }
              >
                <SelectTrigger className="h-12 text-base rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                  <SelectItem value="reimbursement">Reimbursement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAdjustment.amount}
                  onChange={(e) =>
                    setNewAdjustment({ ...newAdjustment, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="h-12 text-base rounded-xl border-gray-200 pl-7"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Note (optional)
              </label>
              <Textarea
                value={newAdjustment.note}
                onChange={(e) =>
                  setNewAdjustment({ ...newAdjustment, note: e.target.value })
                }
                placeholder="Add a note..."
                className="min-h-[80px] text-base rounded-xl border-gray-200"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAdjustmentModal(false)}
                className="flex-1 h-12 text-base rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAdjustment}
                className="flex-1 h-12 text-base rounded-xl bg-[#2596be] hover:bg-[#1e7a9a]"
              >
                Add Adjustment
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
