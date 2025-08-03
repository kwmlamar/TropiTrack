"use client"

import { useState, useEffect, useMemo, useRef } from "react"

import { Card, CardContent } from "@/components/ui/card"

import { getAggregatedPayrolls, getPayrollPayments, addPayrollPayment, setPayrollPaymentAmount, deletePayroll } from "@/lib/data/payroll"
import type { PayrollRecord, PayrollPayment } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import type { DateRange } from "react-day-picker"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, SlidersHorizontal, ChevronLeft, ChevronRight, MoreVertical, TrendingUp, TrendingDown } from "lucide-react"
import { updatePayrollStatus } from "@/lib/data/payroll"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

const ITEMS_PER_PAGE = 20;

// Loading Skeleton Component
const PayrollSkeleton = () => {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        {/* Header Skeleton */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0">
          <div className="flex items-center space-x-2">
            <div>
              <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Section Skeleton */}
        <div className="">
          <div className="space-y-2 overflow-x-auto">
            {/* Filters Row Skeleton */}
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-28 bg-muted animate-pulse rounded"></div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border bg-sidebar">
              <div className="border-b">
                <div className="grid grid-cols-9 gap-4 p-4">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
              
              {/* Table Rows Skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="grid grid-cols-9 gap-4 p-4">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PayrollPage({ user }: { user: User }) {
  const searchParams = useSearchParams()
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])

  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [payPeriodType, setPayPeriodType] = useState<string>("weekly")
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<string>>(new Set())

  const [currentPage, setCurrentPage] = useState(1)
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1) // Default to Monday

  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)
  const processedSearchParamsRef = useRef<string>('')


  // Payment modal state
  const [modalOpen, setModalOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [modalPayroll, setModalPayroll] = useState<PayrollRecord | null>(null)
  const [payments, setPayments] = useState<PayrollPayment[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [newAmount, setNewAmount] = useState("")
  const [adding, setAdding] = useState(false)
  const [paymentType, setPaymentType] = useState<"net" | "gross">("net")

  // Table state for inline editing
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string | null>(null)
  const [paymentAmountValue, setPaymentAmountValue] = useState("")
  const [savingPaymentAmount, setSavingPaymentAmount] = useState<string | null>(null)

  // Previous period data for percentage calculations
  const [previousPeriodData, setPreviousPeriodData] = useState({
    totalPayroll: 0,
    totalWorkers: 0,
    totalNIB: 0,
    totalUnpaid: 0
  })




  
  // Hard-coded deduction calculation
  const calculateDeductions = (grossPay: number) => {
    const nibDeduction = grossPay * 0.0465 // 4.65% NIB rate
    const otherDeductions = 0 // No other deductions for now
    return { nibDeduction, otherDeductions }
  }

  // Initialize week start day from payroll settings
  useEffect(() => {
    // Hard-coded to Saturday start (6)
    const weekStartDay = 6 // Saturday
    setWeekStartDay(weekStartDay)
    
    // Set navigable date range to current week initially
    setDateRange({
      from: startOfWeek(new Date(), { weekStartsOn: weekStartDay }),
      to: endOfWeek(new Date(), { weekStartsOn: weekStartDay }),
    })

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setPayPeriodType("weekly")
  }, [])

  // Handle URL parameters for navigation from dashboard
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const periodType = searchParams.get('periodType')

    const currentParams = `${dateFrom}-${dateTo}-${periodType}`
    
    // Only process if the params have actually changed
    if (currentParams === processedSearchParamsRef.current) {
      return
    }
    
    processedSearchParamsRef.current = currentParams

    if (dateFrom && dateTo) {
      setDateRange({
        from: new Date(dateFrom),
        to: new Date(dateTo)
      })
    }

    if (periodType) {
      // Map dashboard period types to payroll period types
      const periodTypeMap: Record<string, string> = {
        'daily': 'weekly',
        'weekly': 'weekly',
        'monthly': 'monthly'
      }
      setPayPeriodType(periodTypeMap[periodType] || 'weekly')
    }
  }, [searchParams.toString()])

  useEffect(() => {
    // Only load payroll if we have a valid date range
    if (!dateRange?.from || !dateRange?.to) {
      return
    }
    
    loadPayroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange?.from?.getTime(), dateRange?.to?.getTime(), payPeriodType])

  // Filter payrolls based on status using useMemo
  const filteredPayrolls = useMemo(() => {
    let filtered = payrolls;
    
    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(payroll => payroll.status === selectedStatus);
    }
    
    return filtered;
  }, [payrolls, selectedStatus]);

  // Reset to first page when status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const loadPayroll = async () => {
    // Prevent multiple simultaneous loads
    if (isLoading) {
      return
    }
    
    // Prevent loading if no valid date range
    if (!dateRange?.from || !dateRange?.to) {
      return
    }
    
    setIsLoading(true)
    try {
      const filters: { date_from?: string; date_to?: string; target_period_type: "weekly" | "bi-weekly" | "monthly" } = {
        target_period_type: payPeriodType as "weekly" | "bi-weekly" | "monthly"
      }

      if (dateRange?.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange?.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      // Load current period data
      const currentResponse = await getAggregatedPayrolls(filters)

      // Calculate previous period dates
      let previousPeriodStart: Date | null = null
      let previousPeriodEnd: Date | null = null
      
      if (dateRange?.from && dateRange?.to) {
        const currentPeriodDuration = dateRange.to.getTime() - dateRange.from.getTime()
        const oneDay = 24 * 60 * 60 * 1000
        const daysDifference = Math.round(currentPeriodDuration / oneDay)
        
        previousPeriodEnd = new Date(dateRange.from)
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
        previousPeriodStart = new Date(previousPeriodEnd)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDifference + 1)
      }

      // Load previous period data
      let previousPeriodData = {
        totalPayroll: 0,
        totalWorkers: 0,
        totalNIB: 0,
        totalUnpaid: 0
      }

      if (previousPeriodStart && previousPeriodEnd) {
        const previousFilters = {
          ...filters,
          date_from: format(previousPeriodStart, "yyyy-MM-dd"),
          date_to: format(previousPeriodEnd, "yyyy-MM-dd")
        }

        try {
          const previousResponse = await getAggregatedPayrolls(previousFilters)
          if (previousResponse.data && previousResponse.data.length > 0) {
            // Calculate previous period totals
            previousPeriodData = {
              totalPayroll: previousResponse.data.reduce((sum, payroll) => sum + payroll.gross_pay, 0),
              totalWorkers: previousResponse.data.length,
              totalNIB: previousResponse.data.reduce((sum, payroll) => {
                const { nibDeduction } = calculateDeductions(payroll.gross_pay)
                return sum + nibDeduction
              }, 0),
              totalUnpaid: previousResponse.data.reduce((sum, payroll) => {
                const { nibDeduction, otherDeductions } = calculateDeductions(payroll.gross_pay)
                const netPay = payroll.gross_pay - (nibDeduction + otherDeductions)
                return sum + Math.max(0, netPay)
              }, 0)
            }
          }
        } catch (error) {
          console.error('Failed to load previous period data:', error)
          // Continue with default values if previous period fails to load
        }
      }

      if (isMountedRef.current) {
        setPreviousPeriodData(previousPeriodData)
      }

      if (currentResponse.data) {
        // Fetch all payments for all payrolls in a single batch
        const allPayrollIds = currentResponse.data.map(payroll => payroll.id)
        const allPayments = await Promise.all(
          allPayrollIds.map(id => getPayrollPayments(id))
        )

        // Process payrolls with payment data
        const processedPayrolls = currentResponse.data.map((payroll, index) => {
          const { nibDeduction, otherDeductions } = calculateDeductions(payroll.gross_pay)
          
          // Get payments for this specific payroll
          const payments = allPayments[index] || []
          const totalPaid = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
          
          // Calculate net pay and remaining balance
          const netPay = payroll.gross_pay - (nibDeduction + otherDeductions)
          const remainingBalance = payroll.status === "paid" ? 0 : Math.max(0, netPay - totalPaid)
          
          return {
            ...payroll,
            nib_deduction: nibDeduction,
            other_deductions: otherDeductions,
            total_deductions: nibDeduction + otherDeductions,
            net_pay: netPay,
            total_paid: totalPaid,
            remaining_balance: remainingBalance,
          }
        })
        
        if (isMountedRef.current) {
          setPayrolls(processedPayrolls)
        }
      } else {
        if (isMountedRef.current) {
          setPayrolls([])
        }
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      if (isMountedRef.current) {
        setPayrolls([])
        // Reset previous period data on error
        setPreviousPeriodData({
          totalPayroll: 0,
          totalWorkers: 0,
          totalNIB: 0,
          totalUnpaid: 0
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const handlePreviousWeek = () => {
    if (dateRange?.from) {
      const newFrom = startOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newFrom.setDate(newFrom.getDate() - 7)
      const newTo = endOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newTo.setDate(newTo.getDate() - 7)
      setDateRange({ from: newFrom, to: newTo })
    }
  }

  const handleNextWeek = () => {
    if (dateRange?.from) {
      const newFrom = startOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newFrom.setDate(newFrom.getDate() + 7)
      const newTo = endOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newTo.setDate(newTo.getDate() + 7)
      setDateRange({ from: newFrom, to: newTo })
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredPayrolls.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPayrolls = filteredPayrolls.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate summary data from payrolls for current period


  // These variables are calculated for potential future use in reports or analytics
  // const totalGrossPay = payrolls.reduce((total, payroll) => total + payroll.gross_pay, 0);
  // const totalNetPay = payrolls.reduce((total, payroll) => total + payroll.net_pay, 0);
  // const totalPaid = payrolls.reduce((total, payroll) => total + (payroll.total_paid || 0), 0);

  const handlePreviewAndConfirm = () => {
    if (selectedPayrollIds.size === 0) {
      toast.error("Please select payroll entries to confirm.")
      return
    }

    // Check if all selected payrolls are in pending status
    const selectedPayrolls = payrolls.filter(payroll => selectedPayrollIds.has(payroll.id))
    const nonPendingPayrolls = selectedPayrolls.filter(payroll => payroll.status !== "pending")
    
    if (nonPendingPayrolls.length > 0) {
      toast.error("Only payroll entries with 'pending' status can be confirmed.")
      return
    }

    // Directly confirm payrolls without preview dialog
    handleDirectConfirm()
  }

  const handleDirectConfirm = async () => {
    if (selectedPayrollIds.size === 0) {
      return
    }

    const payrollIdsToUpdate = Array.from(selectedPayrollIds)
    const result = await updatePayrollStatus(payrollIdsToUpdate, "confirmed")

    if (result.success) {
      toast.success(`Successfully confirmed ${selectedPayrollIds.size} payroll entries.`)
      setSelectedPayrollIds(new Set())
      if (isMountedRef.current) {
        loadPayroll() // Refresh payroll data
      }
    } else {
      toast.error("Failed to confirm payroll entries.", {
        description: result.error || "An unknown error occurred.",
      })
    }
  }



  const handleMarkAsPaid = async () => {
    if (selectedPayrollIds.size === 0) {
      return
    }

    // Check if all selected payrolls are in confirmed status
    const selectedPayrolls = payrolls.filter(payroll => selectedPayrollIds.has(payroll.id))
    const nonConfirmedPayrolls = selectedPayrolls.filter(payroll => payroll.status !== "confirmed")
    
    if (nonConfirmedPayrolls.length > 0) {
      toast.error("Only payroll entries with 'confirmed' status can be marked as paid.")
      return
    }

    // Check for payrolls with remaining balance and ask user what to do
    const payrollsWithBalance = selectedPayrolls.filter(payroll => (payroll.remaining_balance || 0) > 0)
    
    if (payrollsWithBalance.length > 0) {
      const totalRemaining = payrollsWithBalance.reduce((sum, payroll) => sum + (payroll.remaining_balance || 0), 0)
      const shouldAutoComplete = confirm(
        `${payrollsWithBalance.length} payroll(s) have remaining balance of $${totalRemaining.toFixed(2)}. ` +
        "Would you like to automatically add the remaining balance as final payments before marking as paid?"
      )
      
      if (shouldAutoComplete) {
        // Add final payments for remaining balances
        for (const payroll of payrollsWithBalance) {
          const remainingBalance = payroll.remaining_balance || 0
          if (remainingBalance > 0) {
            const res = await setPayrollPaymentAmount(payroll.id, (payroll.total_paid || 0) + remainingBalance, user.id)
            if (!res.success) {
              toast.error(`Failed to add final payment for ${payroll.worker_name}`)
              return
            }
          }
        }
        toast.success("Final payments added for remaining balances")
        // Refresh payroll data to show updated payment amounts
        if (isMountedRef.current) {
          await loadPayroll()
        }
      } else {
        // User chose not to auto-complete, so we'll proceed with current balances
        toast.info("Proceeding with current payment amounts")
      }
    }

    const payrollIdsToUpdate = Array.from(selectedPayrollIds)
    const result = await updatePayrollStatus(payrollIdsToUpdate, "paid")

    if (result.success) {
      toast.success("Selected payrolls marked as paid.")
      setSelectedPayrollIds(new Set())
      if (isMountedRef.current) {
        loadPayroll() // Refresh payroll data
      }
    } else {
      toast.error("Failed to mark payrolls as paid.", {
        description: result.error || "An unknown error occurred.",
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPayrollIds = new Set(paginatedPayrolls.map(payroll => payroll.id));
      setSelectedPayrollIds(allPayrollIds);
    } else {
      setSelectedPayrollIds(new Set());
    }
  };

  const handleSelectPayroll = (id: string, checked: boolean) => {
    setSelectedPayrollIds(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  // Payment functions - commented out as it's not currently used
  // const openPaymentsModal = async (payroll: PayrollRecord) => {
  //   setModalPayroll(payroll)
  //   setModalOpen(true)
  //   setLoadingPayments(true)
  //   const result = await getPayrollPayments(payroll.id)
  //   setPayments(result)
  //   setLoadingPayments(false)
  // }

  const handleAddPayment = async () => {
    if (!modalPayroll || !newAmount) return
    setAdding(true)
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      setAdding(false)
      return
    }
    
    const totalPaid = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
    const maxAmount = paymentType === "net" ? modalPayroll.net_pay : modalPayroll.gross_pay
    const remainingBalance = maxAmount - totalPaid
    
    if (amount > remainingBalance) {
      toast.error(`Amount exceeds remaining ${paymentType} pay balance`)
      setAdding(false)
      return
    }
    
    const res = await addPayrollPayment({
      payroll_id: modalPayroll.id,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      status: "completed",
              notes: `Payment (${paymentType} pay)`,
      created_by: undefined,
    })
    if (res.success) {
      toast.success("Payment added")
      setNewAmount("")
      // Refresh payments
      const result = await getPayrollPayments(modalPayroll.id)
      setPayments(result)
    } else {
      toast.error(res.error || "Failed to add payment")
    }
    setAdding(false)
  }

  // Inline editing functions
  const handlePaymentAmountEdit = (payrollId: string, currentValue: string) => {
    setEditingPaymentAmount(payrollId)
    setPaymentAmountValue(currentValue)
  }

  const handlePaymentAmountSave = async (payrollId: string) => {
    const amount = parseFloat(paymentAmountValue)
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setSavingPaymentAmount(payrollId)

    // Update local state immediately for better UX
    if (isMountedRef.current) {
      setPayrolls(prevPayrolls => 
        prevPayrolls.map(payroll => 
          payroll.id === payrollId 
            ? { ...payroll, total_paid: amount, remaining_balance: Math.max(0, payroll.net_pay - amount) }
            : payroll
        )
      )
    }
    
    setEditingPaymentAmount(null)
    setPaymentAmountValue("")

    try {
      const res = await setPayrollPaymentAmount(payrollId, amount, user.id)

      if (res.success) {
        toast.success("Payment amount updated successfully")
      } else {
        toast.error(res.error || "Failed to update payment amount")
        // Revert local state if the API call failed
        if (isMountedRef.current) {
          setPayrolls(prevPayrolls => 
            prevPayrolls.map(payroll => 
              payroll.id === payrollId 
                ? { ...payroll, total_paid: payroll.total_paid || 0, remaining_balance: Math.max(0, payroll.net_pay - (payroll.total_paid || 0)) }
                : payroll
            )
          )
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error updating payment amount:", error)
      // Revert local state if there was an error
      if (isMountedRef.current) {
        setPayrolls(prevPayrolls => 
          prevPayrolls.map(payroll => 
            payroll.id === payrollId 
              ? { ...payroll, total_paid: payroll.total_paid || 0, remaining_balance: Math.max(0, payroll.net_pay - (payroll.total_paid || 0)) }
              : payroll
          )
        )
      }
    } finally {
      setSavingPaymentAmount(null)
    }
  }

  const handlePaymentAmountCancel = () => {
    setEditingPaymentAmount(null)
    setPaymentAmountValue("")
  }

  const handleDeletePayroll = async (payrollId: string) => {
    if (!confirm("Are you sure you want to delete this payroll record? This action cannot be undone.")) {
      return
    }

    try {
      const result = await deletePayroll(payrollId)
      
      if (result.success) {
        toast.success("Payroll record deleted successfully")
        // Remove the deleted payroll from local state
        if (isMountedRef.current) {
          setPayrolls(prevPayrolls => prevPayrolls.filter(payroll => payroll.id !== payrollId))
        }
      } else {
        toast.error("Failed to delete payroll record", {
          description: result.error || "An unknown error occurred.",
        })
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting the payroll record")
      console.error("Error deleting payroll:", error)
    }
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate current period totals with useMemo for performance
  const currentPeriodData = useMemo(() => ({
    totalPayroll: payrolls.reduce((sum, payroll) => sum + payroll.gross_pay, 0),
    totalWorkers: payrolls.length,
    totalNIB: payrolls.reduce((sum, payroll) => sum + payroll.nib_deduction, 0),
    totalUnpaid: payrolls.reduce((sum, payroll) => sum + (payroll.remaining_balance || 0), 0)
  }), [payrolls]);

  // Calculate percentage changes with useMemo for performance
  const percentageChanges = useMemo(() => ({
    totalPayroll: calculatePercentageChange(currentPeriodData.totalPayroll, previousPeriodData.totalPayroll),
    totalWorkers: calculatePercentageChange(currentPeriodData.totalWorkers, previousPeriodData.totalWorkers),
    totalNIB: calculatePercentageChange(currentPeriodData.totalNIB, previousPeriodData.totalNIB),
    totalUnpaid: calculatePercentageChange(currentPeriodData.totalUnpaid, previousPeriodData.totalUnpaid)
  }), [currentPeriodData, previousPeriodData]);

  const getStatusBadge = (status: PayrollRecord['status']) => {
    const labels = {
      paid: "Paid",
      pending: "Pending",
      confirmed: "Confirmed",
      void: "Void",
    };

    const getBadgeClassName = (status: PayrollRecord['status']) => {
      switch (status) {
        case "paid":
          return "bg-green-600/20 text-green-600 border-green-600/30 hover:bg-green-600/30 dark:bg-green-600/20 dark:text-green-600 dark:border-green-600/30 dark:hover:bg-green-600/30 px-3 py-1 text-xs font-medium rounded-2xl";
        case "pending":
          return "bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30 dark:bg-orange-500/20 dark:text-orange-500 dark:border-orange-500/30 dark:hover:bg-orange-500/30 px-3 py-1 text-xs font-medium rounded-2xl";
        case "confirmed":
          return "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-400/20 dark:text-blue-400 dark:border-blue-400/30 dark:hover:bg-blue-400/30 px-3 py-1 text-xs font-medium rounded-2xl";
        case "void":
          return "bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30 dark:bg-red-400/20 dark:text-red-400 dark:border-red-400/30 dark:hover:bg-red-400/30 px-3 py-1 text-xs font-medium rounded-2xl";
        default:
          return "bg-gray-500/20 text-gray-600 border-gray-500/30 hover:bg-gray-500/30 dark:bg-gray-400/20 dark:text-gray-400 dark:border-gray-400/30 dark:hover:bg-gray-400/30 px-3 py-1 text-xs font-medium rounded-2xl";
      }
    };

    return (
      <Badge className={getBadgeClassName(status)}>
        {labels[status]}
      </Badge>
    );
  };

    if (isLoading) {
    return (
      <PayrollSkeleton />
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0">
            <div className="flex items-center space-x-2">
              <div>
                <h2 className="text-lg font-medium mb-0">
                  Payroll{" "}
                  {dateRange?.from && dateRange?.to
                    ? (
                      <span className="text-gray-500">
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </span>
                    )
                    : (
                      <span className="text-gray-500">Select a date range</span>
                    )}
                </h2>
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={handlePreviousWeek}
                className="h-10 w-10 p-0 !bg-sidebar border-border hover:!bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={handleNextWeek}
                className="h-10 w-10 p-0 !bg-sidebar border-border hover:!bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Payroll</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                      minimumFractionDigits: 2,
                    }).format(currentPeriodData.totalPayroll)}
                  </p>
                  <div className="flex items-center gap-1">
                    {percentageChanges.totalPayroll >= 0 ? (
                      <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                    ) : (
                      <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${
                      percentageChanges.totalPayroll >= 0 
                        ? "text-green-600 dark:text-green-600" 
                        : "text-red-600 dark:text-red-600"
                    }`}>
                      {percentageChanges.totalPayroll >= 0 ? "+" : ""}{percentageChanges.totalPayroll}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Workers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">
                    {currentPeriodData.totalWorkers}
                  </p>
                  <div className="flex items-center gap-1">
                    {percentageChanges.totalWorkers >= 0 ? (
                      <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                    ) : (
                      <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${
                      percentageChanges.totalWorkers >= 0 
                        ? "text-green-600 dark:text-green-600" 
                        : "text-red-600 dark:text-red-600"
                    }`}>
                      {percentageChanges.totalWorkers >= 0 ? "+" : ""}{percentageChanges.totalWorkers}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-400">NIB Remittance</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                      minimumFractionDigits: 2,
                    }).format(currentPeriodData.totalNIB)}
                  </p>
                  <div className="flex items-center gap-1">
                    {typeof percentageChanges.totalNIB === 'number' && percentageChanges.totalNIB >= 0 ? (
                      <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                    ) : (
                      <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${
                      typeof percentageChanges.totalNIB === 'number' && percentageChanges.totalNIB >= 0
                        ? "text-green-600 dark:text-green-600"
                        : "text-red-600 dark:text-red-600"
                    }`}>
                      {typeof percentageChanges.totalNIB === 'number'
                        ? `${percentageChanges.totalNIB >= 0 ? '+' : ''}${percentageChanges.totalNIB}%`
                        : '--%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sidebar border border-border/50 shadow-none">
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Unpaid Balance</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                      minimumFractionDigits: 2,
                    }).format(currentPeriodData.totalUnpaid)}
                  </p>
                  <div className="flex items-center gap-1">
                    {typeof percentageChanges.totalUnpaid === 'number' && percentageChanges.totalUnpaid >= 0 ? (
                      <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                    ) : (
                      <TrendingDown className="text-red-600 dark:text-red-600 h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${
                      typeof percentageChanges.totalUnpaid === 'number' && percentageChanges.totalUnpaid >= 0
                        ? "text-green-600 dark:text-green-600"
                        : "text-red-600 dark:text-red-600"
                    }`}>
                      {typeof percentageChanges.totalUnpaid === 'number'
                        ? `${percentageChanges.totalUnpaid >= 0 ? '+' : ''}${percentageChanges.totalUnpaid}%`
                        : '--%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="">
            <div className="space-y-2 overflow-x-auto">
                    {/* Search, Filters, and Actions Row */}
                    <div className="flex items-center gap-4 p-4">
                  {/* Payroll Details Section */}
                      <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-900">Payroll Details</h3>
                      </div>

                      {/* Filters Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {(payPeriodType !== "weekly" || selectedStatus !== "all") && (
                              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                                {(payPeriodType !== "weekly" ? 1 : 0) + (selectedStatus !== "all" ? 1 : 0)}
                              </Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-4">
                          <DropdownMenuLabel className="text-base font-semibold">
                            Filter Payroll
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Status Filter */}
                          <div className="space-y-3 py-2">
                            <Label className="text-sm font-medium">Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Clear Filters */}
                          {(payPeriodType !== "weekly" || selectedStatus !== "all") && (
                            <div className="pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPayPeriodType("weekly");
                                  setSelectedStatus("all");
                                }}
                                className="w-full justify-start text-gray-500 hover:text-foreground"
                              >
                                Clear filters
                              </Button>
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Preview and Confirm Button */}
                      <Button
                        variant="outline"
                        onClick={handlePreviewAndConfirm}
                        disabled={selectedPayrollIds.size === 0 || !Array.from(selectedPayrollIds).every(id => 
                          payrolls.find(payroll => payroll.id === id)?.status === "pending"
                        )}
                      >
                        Confirm Payroll
                      </Button>

                      {/* Mark as Paid Button */}
                      <Button
                        onClick={handleMarkAsPaid}
                        disabled={selectedPayrollIds.size === 0 || !Array.from(selectedPayrollIds).every(id => 
                          payrolls.find(payroll => payroll.id === id)?.status === "confirmed"
                        )}
                    className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Run Payroll
                      </Button>
                    </div>

                {/* Inline Payroll Table */}
                <div className="rounded-md border bg-sidebar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 text-gray-500">
                          <Checkbox
                            color="var(--muted-foreground)"
                            checked={selectedPayrollIds.size === paginatedPayrolls.length && paginatedPayrolls.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(checked === true)}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="px-4 text-gray-500">Worker</TableHead>
                        <TableHead className="px-4 text-gray-500">Hourly Rate</TableHead>
                        <TableHead className="px-4 text-gray-500">Gross Pay</TableHead>
                        <TableHead className="px-4 text-gray-500">NIB Deduction</TableHead>
                        <TableHead className="px-4 text-gray-500">Net Pay</TableHead>
                        <TableHead className="px-4 text-gray-500">Payment Amount</TableHead>
                        <TableHead className="px-4 text-gray-500">Status</TableHead>
                        <TableHead className="px-4 text-gray-500 w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayrolls.length ? (
                        paginatedPayrolls.map((payroll) => (
                          <TableRow key={payroll.id}>
                            <TableCell className="px-4">
                              <Checkbox
                                color="var(--muted-foreground)"
                                checked={selectedPayrollIds.has(payroll.id)}
                                onCheckedChange={(checked) => handleSelectPayroll(payroll.id, checked === true)}
                                aria-label="Select payroll"
                              />
                            </TableCell>
                            <TableCell className="px-4">
                              <div>
                                <div className="font-medium">{payroll.worker_name}</div>
                                <div className="text-sm text-gray-500">{payroll.position}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="font-medium text-gray-500">
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.hourly_rate)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="font-medium text-gray-500">
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.gross_pay)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="font-medium text-gray-500">
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.nib_deduction)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="font-medium text-gray-500">
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.net_pay)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4">
                              {(() => {
                                const totalPaid = payroll.total_paid || 0
                                const isEditing = editingPaymentAmount === payroll.id

                                if (isEditing) {
                                  return (
                                    <div className="space-y-2">
                                      <Input
                                        type="number"
                                        value={paymentAmountValue}
                                        onChange={(e) => setPaymentAmountValue(e.target.value)}
                                        className="w-20 h-8 text-center text-sm border-muted/50 focus:border-primary"
                                        step="1"
                                        min="0"
                                        placeholder=""
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handlePaymentAmountSave(payroll.id)
                                          } else if (e.key === "Escape") {
                                            handlePaymentAmountCancel()
                                          }
                                        }}
                                        autoFocus
                                        disabled={savingPaymentAmount === payroll.id}
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handlePaymentAmountSave(payroll.id)}
                                          className="h-6 px-2 text-xs"
                                          disabled={savingPaymentAmount === payroll.id}
                                        >
                                          {savingPaymentAmount === payroll.id ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          ) : (
                                            "Save"
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handlePaymentAmountCancel}
                                          className="h-6 px-2 text-xs"
                                          disabled={savingPaymentAmount === payroll.id}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                }

                                return (
                                  <div>
                                    {payroll.status === "confirmed" ? (
                                      totalPaid === 0 ? (
                                        <button
                                          onClick={() => handlePaymentAmountEdit(payroll.id, "0")}
                                          className="font-medium text-gray-500 hover:text-foreground cursor-pointer text-center w-full"
                                        >
                                          -
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePaymentAmountEdit(payroll.id, totalPaid.toString())}
                                          className="font-medium text-gray-500 hover:text-foreground cursor-pointer"
                                        >
                                          {new Intl.NumberFormat("en-BS", {
                                            style: "currency",
                                            currency: "BSD",
                                            minimumFractionDigits: 2,
                                          }).format(totalPaid)}
                                        </button>
                                      )
                                    ) : (
                                      <span className="font-medium text-gray-400">
                                        {totalPaid === 0 ? (
                                          "-"
                                        ) : (
                                          new Intl.NumberFormat("en-BS", {
                                            style: "currency",
                                            currency: "BSD",
                                            minimumFractionDigits: 2,
                                          }).format(totalPaid)
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="font-medium text-gray-500">
                                {getStatusBadge(payroll.status)}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 w-16">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted text-gray-500"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePayroll(payroll.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    Delete Payroll
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center px-4">
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Pagination Controls */}
                  {filteredPayrolls.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="text-sm text-gray-500">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredPayrolls.length)} of {filteredPayrolls.length} payroll records
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={`h-8 w-8 p-0 ${currentPage === page
                                  ? "bg-[#E8EDF5] text-primary border-[#E8EDF5] dark:bg-primary dark:text-primary-foreground dark:border-primary"
                                  : "hover:bg-[#E8EDF5]/70 dark:hover:bg-primary dark:hover:text-primary-foreground"
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
                          disabled={currentPage === totalPages}
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
          </div>

              {/* Payment History Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                              <span>Payment History</span>
            </DialogTitle>
            <DialogDescription>
                              Manage payment history for {modalPayroll?.worker_name}
            </DialogDescription>
          </DialogHeader>
          {modalPayroll && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500">Gross Pay</div>
                  <div className="text-lg font-bold">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                    }).format(modalPayroll.gross_pay)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500">Net Pay</div>
                  <div className="text-lg font-bold">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                    }).format(modalPayroll.net_pay)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500">Total Paid</div>
                  <div className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                    }).format(payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500">Remaining</div>
                  <div className="text-lg font-bold text-orange-600">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                    }).format((paymentType === "net" ? modalPayroll.net_pay : modalPayroll.gross_pay) - payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0))}
                  </div>
                </div>
              </div>
              
              {/* Payment History */}
              <div>
                <div className="font-semibold mb-3">Payment History</div>
                {loadingPayments ? (
                  <div className="text-center py-4 text-gray-500">Loading payments...</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    No payments yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {payments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {new Intl.NumberFormat("en-BS", {
                              style: "currency",
                              currency: "BSD",
                            }).format(Number(payment.amount))}
                          </div>
                          <div className="text-sm text-gray-500">{payment.payment_date}</div>
                        </div>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add New Payment */}
              <div className="border-t pt-4">
                <div className="font-semibold mb-3">Add New Payment</div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="payment-amount" className="text-sm">Amount</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Enter amount"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-sm">Payment Type</Label>
                      <Select value={paymentType} onValueChange={(value: "net" | "gross") => setPaymentType(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net">Net Pay</SelectItem>
                          <SelectItem value="gross">Gross Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddPayment} disabled={adding || !newAmount} className="w-full">
                    {adding ? "Adding..." : "Add Payment"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
