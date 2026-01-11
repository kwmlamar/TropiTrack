"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useTheme } from "next-themes"

import { Card, CardContent } from "@/components/ui/card"

import { getAggregatedPayrolls, getPayrollPayments, getPayrollPaymentsBatch, addPayrollPayment, setPayrollPaymentAmount, deletePayroll, generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"
import type { PayrollRecord, PayrollPayment } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidersHorizontal, ChevronLeft, ChevronRight, MoreVertical, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronDown, Plus, CalendarDays, RefreshCw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { updatePayrollStatus, checkPendingTimesheetsForPayrolls } from "@/lib/data/payroll"
import { toast } from "sonner"
import { useDateRange } from "@/context/date-range-context"

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
  const { theme } = useTheme()
  
  return (
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
          <div className="flex items-center space-x-2">
            <div>
              <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card 
              key={i} 
              className="shadow-none"
              style={{
                backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
              }}
            >
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
        <div 
          className="border-t border-b flex-1 flex flex-col"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
            borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
          }}
        >
          <div className="px-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
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

interface PayrollPageProps {
  user: User;
  selectedPayrollIds?: Set<string>;
  onSelectedPayrollIdsChange?: (ids: Set<string>) => void;
  onPayrollsChange?: (payrolls: PayrollRecord[]) => void;
  onConfirmHandlerChange?: (handler: () => void) => void;
  onMarkAsPaidHandlerChange?: (handler: () => void) => void;
}

export default function PayrollPage({ 
  user, 
  selectedPayrollIds: externalSelectedPayrollIds,
  onSelectedPayrollIdsChange,
  onPayrollsChange,
  onConfirmHandlerChange,
  onMarkAsPaidHandlerChange
}: PayrollPageProps) {
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const [internalPayrolls, setInternalPayrolls] = useState<PayrollRecord[]>([])
  const [internalSelectedPayrollIds, setInternalSelectedPayrollIds] = useState<Set<string>>(new Set())
  
  // Use external state if provided, otherwise use internal state
  const payrolls = internalPayrolls;
  const selectedPayrollIds = externalSelectedPayrollIds || internalSelectedPayrollIds;
  
  // Use ref to store the callback so it doesn't cause dependency issues
  const onPayrollsChangeRef = useRef(onPayrollsChange);
  useEffect(() => {
    onPayrollsChangeRef.current = onPayrollsChange;
  }, [onPayrollsChange]);

  const setPayrolls = useCallback((payrolls: PayrollRecord[] | ((prev: PayrollRecord[]) => PayrollRecord[])) => {
    if (typeof payrolls === 'function') {
      setInternalPayrolls((prev) => {
        const newPayrolls = payrolls(prev);
        onPayrollsChangeRef.current?.(newPayrolls);
        return newPayrolls;
      });
    } else {
      setInternalPayrolls(payrolls);
      onPayrollsChangeRef.current?.(payrolls);
    }
  }, []);
  
  const setSelectedPayrollIds = (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const newIds = typeof ids === 'function' ? ids(selectedPayrollIds) : ids;
    setInternalSelectedPayrollIds(newIds);
    onSelectedPayrollIdsChange?.(newIds);
  };
  
  // Use global date range context instead of local state
  const { dateRange, setDateRange } = useDateRange()
  const [payPeriodType, setPayPeriodType] = useState<string>("weekly")

  const [currentPage, setCurrentPage] = useState(1)
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1) // Default to Monday

  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [remainingBalanceView, setRemainingBalanceView] = useState<"net" | "gross" | "both">("net")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const isMountedRef = useRef(true)
  const processedSearchParamsRef = useRef<string>('')
  const loadingRef = useRef(false) // Add ref to track loading state
  
  // Cache for payroll data to prevent redundant API calls
  const payrollCacheRef = useRef<Map<string, { data: PayrollRecord[], timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Calendar popover state
  const [calendarOpen, setCalendarOpen] = useState(false)

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
  const [showConfirmPayrollModal, setShowConfirmPayrollModal] = useState(false)

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




  // NIB deductions are calculated server-side during payroll generation
  // and respect both company-level settings and per-worker exemptions

  // Share handlers with parent component (for header actions)
  useEffect(() => {
    onConfirmHandlerChange?.(handlePreviewAndConfirm);
    onMarkAsPaidHandlerChange?.(handleMarkAsPaid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onConfirmHandlerChange, onMarkAsPaidHandlerChange, selectedPayrollIds, payrolls]);

  // Initialize week start day from payroll settings
  useEffect(() => {
    console.log('useEffect: initializing date range');
    // Hard-coded to Saturday start (6)
    const weekStartDay = 6 // Saturday
    setWeekStartDay(weekStartDay)

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
  }, [searchParams, setDateRange])

  const loadPayroll = useCallback(async (forceRefresh = false) => {
    // Prevent loading if no valid date range
    if (!dateRange?.from || !dateRange?.to) {
      console.log('loadPayroll: no valid date range, returning');
      return
    }
    
    // Prevent multiple simultaneous loads
    if (loadingRef.current && !forceRefresh) {
      console.log('loadPayroll: already loading, returning');
      return
    }
    
    console.log('loadPayroll: starting to load data');
    loadingRef.current = true
    setIsLoading(true)
    
    // Set a timeout to prevent infinite loading states
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('loadPayroll: loading timeout reached, setting isLoading to false');
        setIsLoading(false)
      }
    }, 30000) // 30 second timeout
    
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

      // Create cache key
      const cacheKey = `${filters.date_from}-${filters.date_to}-${filters.target_period_type}`
      const cachedData = payrollCacheRef.current.get(cacheKey)
      const now = Date.now()
      
      // Check if we have valid cached data (skip cache if forceRefresh is true)
      if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        console.log('loadPayroll: using cached data');
        if (isMountedRef.current) {
          setPayrolls(cachedData.data)
          setIsLoading(false)
          loadingRef.current = false
        }
        return
      }

      console.log('loadPayroll: calling getAggregatedPayrolls with filters', filters);

      // Load current period data
      const currentResponse = await getAggregatedPayrolls(filters)

      console.log('loadPayroll: currentResponse', currentResponse);

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

      // Load previous period data (only if we have valid dates)
      let previousPeriodData = {
        totalPayroll: 0,
        totalWorkers: 0,
        totalNIB: 0,
        totalUnpaid: 0
      }

      // Only load previous period data if we have valid dates and it's not the same period
      if (previousPeriodStart && previousPeriodEnd && 
          (previousPeriodStart.getTime() !== dateRange.from.getTime() || 
           previousPeriodEnd.getTime() !== dateRange.to.getTime())) {
        
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
                // Use NIB deduction from database (already calculated with worker exemptions)
                const nibDeduction = payroll.nib_deduction || 0
                return sum + nibDeduction
              }, 0),
              totalUnpaid: previousResponse.data.reduce((sum, payroll) => {
                // Use deductions from database
                const nibDeduction = payroll.nib_deduction || 0
                const otherDeductions = payroll.other_deductions || 0
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
        const paymentsByPayrollId = await getPayrollPaymentsBatch(allPayrollIds)

        // Process payrolls with payment data
        const processedPayrolls = currentResponse.data.map((payroll) => {
          // Use NIB deduction from database (already calculated server-side with worker exemptions)
          const nibDeduction = payroll.nib_deduction || 0
          const otherDeductions = payroll.other_deductions || 0
          
          // Get payments for this specific payroll
          const payments = paymentsByPayrollId[payroll.id] || []
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
          console.log('loadPayroll: setting payrolls', processedPayrolls.length, 'records');
          setPayrolls(processedPayrolls)
          
          // Cache the processed data
          payrollCacheRef.current.set(cacheKey, {
            data: processedPayrolls,
            timestamp: now
          })
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
      console.log('loadPayroll: finally block reached, setting isLoading to false');
      clearTimeout(loadingTimeout)
      loadingRef.current = false
      if (isMountedRef.current) {
        console.log('loadPayroll: calling setIsLoading(false)');
        setIsLoading(false)
      } else {
        console.log('loadPayroll: component not mounted, skipping setIsLoading');
      }
    }
  }, [dateRange, payPeriodType])

  useEffect(() => {
    console.log('useEffect: checking dateRange', { dateRange, user, payPeriodType });
    // Only load payroll if we have a valid date range
    if (!dateRange?.from || !dateRange?.to) {
      console.log('useEffect: no valid date range, returning');
      return
    }
    
    console.log('useEffect: calling loadPayroll');
    loadPayroll()
  }, [loadPayroll])

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

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Calculate the week range for the selected date
      const weekStart = startOfWeek(date, { weekStartsOn: weekStartDay });
      const weekEnd = endOfWeek(date, { weekStartsOn: weekStartDay });
      setDateRange({ from: weekStart, to: weekEnd });
      setCalendarOpen(false);
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

  const handlePreviewAndConfirm = async () => {
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

    // Check for pending timesheets before confirming payroll
    const payrollIdsArray = Array.from(selectedPayrollIds)
    const pendingCheckResult = await checkPendingTimesheetsForPayrolls(payrollIdsArray)
    
    if (!pendingCheckResult.success) {
      toast.error("Failed to check for pending timesheets.", {
        description: pendingCheckResult.error || "An unknown error occurred.",
      })
      return
    }

    if (pendingCheckResult.data?.hasPendingTimesheets) {
      const { pendingCount, details } = pendingCheckResult.data
      
      // Create detailed message about pending timesheets
      const affectedPayrolls = details.filter(d => d.pendingCount > 0)
      const detailsMessage = affectedPayrolls
        .map(d => `${d.workerName} (${d.payPeriod}): ${d.pendingCount} pending timesheet${d.pendingCount > 1 ? 's' : ''}`)
        .join('\n')
      
      const shouldContinue = confirm(
        `Warning: ${pendingCount} pending timesheet${pendingCount > 1 ? 's' : ''} found for the selected payroll period${selectedPayrollIds.size > 1 ? 's' : ''}.\n\n` +
        `Affected payrolls:\n${detailsMessage}\n\n` +
        `Do you want to continue confirming payroll despite having pending timesheets?`
      )
      
      if (!shouldContinue) {
        toast.info("Payroll confirmation cancelled.")
        return
      }
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
        // Add a small delay to ensure database update has completed
        setTimeout(() => {
          loadPayroll(true) // Force refresh payroll data
        }, 500)
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

    // Check for payrolls with amount owed and ask user what to do
    const payrollsWithBalance = selectedPayrolls.filter(payroll => (payroll.remaining_balance || 0) > 0)
    
    if (payrollsWithBalance.length > 0) {
      const totalRemaining = payrollsWithBalance.reduce((sum, payroll) => sum + (payroll.remaining_balance || 0), 0)
      const shouldAutoComplete = confirm(
        `${payrollsWithBalance.length} payroll(s) have amount owed of $${totalRemaining.toFixed(2)}. ` +
        "Would you like to automatically add the amount owed as final payments before marking as paid?"
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
        toast.success("Final payments added for amounts owed")
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
        loadPayroll(true) // Force refresh payroll data
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

  const handlePendingPayrollClick = () => {
    setShowConfirmPayrollModal(true)
  }

  const handleReverseStatus = async (payrollId: string, newStatus: "pending" | "confirmed") => {
    const payroll = payrolls.find(p => p.id === payrollId)
    if (!payroll) return

    const statusLabels = {
      pending: "Pending",
      confirmed: "Confirmed", 
      paid: "Paid"
    }

    const confirmMessage = `Are you sure you want to revert "${payroll.worker_name}" from ${statusLabels[payroll.status]} to ${statusLabels[newStatus]}?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const result = await updatePayrollStatus([payrollId], newStatus)
      
      if (result.success) {
        toast.success(`Payroll status reverted to ${statusLabels[newStatus]}`)
        if (isMountedRef.current) {
          // Add a small delay to ensure database update has completed
          setTimeout(() => {
            loadPayroll(true) // Force refresh payroll data
          }, 500)
        }
      } else {
        toast.error("Failed to revert payroll status", {
          description: result.error || "An unknown error occurred.",
        })
      }
    } catch (error) {
      toast.error("An unexpected error occurred while reverting payroll status")
      console.error("Error reverting payroll status:", error)
    }
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

  const handleRegeneratePayroll = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select a valid date range")
      return
    }

    // Get unique workers from current payroll data
    const uniqueWorkers = Array.from(new Set(payrolls.map(p => p.worker_id)))
    
    if (uniqueWorkers.length === 0) {
      toast.error("No payroll records found for the selected period")
      return
    }

    const confirmed = confirm(
      `This will regenerate payroll for ${uniqueWorkers.length} worker${uniqueWorkers.length > 1 ? 's' : ''} in the selected period (${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}).\n\n` +
      `This will recalculate all deductions based on current payroll settings (including NIB rates).\n\n` +
      `Are you sure you want to continue?`
    )

    if (!confirmed) {
      return
    }

    setIsRegenerating(true)
    
    try {
      const dateFrom = format(dateRange.from, "yyyy-MM-dd")
      const dateTo = format(dateRange.to, "yyyy-MM-dd")
      
      let successCount = 0
      let failCount = 0
      
      // Regenerate payroll for each worker
      for (const workerId of uniqueWorkers) {
        try {
          const result = await generatePayrollForWorkerAndPeriod(
            user.id,
            workerId,
            dateFrom,
            dateTo
          )
          
          if (result.success) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to regenerate payroll for worker ${workerId}:`, result.error)
          }
        } catch (error) {
          failCount++
          console.error(`Error regenerating payroll for worker ${workerId}:`, error)
        }
      }
      
      // Show results
      if (successCount > 0) {
        toast.success(`Successfully regenerated payroll for ${successCount} worker${successCount > 1 ? 's' : ''}`, {
          description: failCount > 0 ? `${failCount} worker${failCount > 1 ? 's' : ''} failed` : "All workers processed successfully"
        })
        
        // Refresh the payroll data
        if (isMountedRef.current) {
          setTimeout(() => {
            loadPayroll(true) // Force refresh
          }, 500)
        }
      } else {
        toast.error("Failed to regenerate payroll", {
          description: "No workers were successfully processed"
        })
      }
    } catch (error) {
      console.error("Error regenerating payroll:", error)
      toast.error("An unexpected error occurred while regenerating payroll")
    } finally {
      setIsRegenerating(false)
    }
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate current period totals with useMemo for performance
  const currentPeriodData = useMemo(() => {
    if (payrolls.length === 0) {
      return {
        totalPayroll: 0,
        totalWorkers: 0,
        totalNIB: 0,
        totalUnpaid: 0
      };
    }
    
    return {
      totalPayroll: payrolls.reduce((sum, payroll) => sum + payroll.gross_pay, 0),
      totalWorkers: payrolls.length,
      totalNIB: payrolls.reduce((sum, payroll) => sum + payroll.nib_deduction, 0),
      totalUnpaid: payrolls.reduce((sum, payroll) => sum + (payroll.remaining_balance || 0), 0)
    };
  }, [payrolls]);

  // Calculate percentage changes with useMemo for performance
  const percentageChanges = useMemo(() => {
    if (payrolls.length === 0) {
      return {
        totalPayroll: 0,
        totalWorkers: 0,
        totalNIB: 0,
        totalUnpaid: 0
      };
    }
    
    const currentTotalPayroll = currentPeriodData.totalPayroll;
    const currentTotalWorkers = currentPeriodData.totalWorkers;
    const currentTotalNIB = currentPeriodData.totalNIB;
    const currentTotalUnpaid = currentPeriodData.totalUnpaid;
    
    return {
      totalPayroll: calculatePercentageChange(currentTotalPayroll, previousPeriodData.totalPayroll),
      totalWorkers: calculatePercentageChange(currentTotalWorkers, previousPeriodData.totalWorkers),
      totalNIB: calculatePercentageChange(currentTotalNIB, previousPeriodData.totalNIB),
      totalUnpaid: calculatePercentageChange(currentTotalUnpaid, previousPeriodData.totalUnpaid)
    };
  }, [currentPeriodData, previousPeriodData, payrolls.length]);

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
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Header with Date Navigation */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center rounded-lg overflow-hidden border"
              style={{
                backgroundColor: theme === 'dark' ? '#0f0f0f' : 'hsl(var(--background))',
                borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240 / 0.5)'
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousWeek}
                className="h-10 w-10 p-0 rounded-none border-0"
                style={{
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 text-center px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: theme === 'dark' ? '#0f0f0f' : 'hsl(var(--background))',
                      color: theme === 'dark' ? '#d1d5db' : '#374151',
                      borderLeft: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
                      borderRight: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
                      border: 'none',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#171717' : 'rgb(249 250 251)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#0f0f0f' : 'hsl(var(--background))'
                    }}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {dateRange?.from && dateRange?.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      'Select a date range'
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={handleCalendarSelect}
                    defaultMonth={dateRange?.from || new Date()}
                    weekStartsOn={weekStartDay}
                    modifiers={{
                      selected: dateRange?.from && dateRange?.to 
                        ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
                        : []
                    }}
                    modifiersClassNames={{
                      selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextWeek}
                className="h-10 w-10 p-0 rounded-none border-0"
                style={{
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Regenerate Payroll Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegeneratePayroll}
              disabled={isRegenerating || isLoading || payrolls.length === 0}
              className="gap-2 h-10"
              style={{
                backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                color: theme === 'dark' ? '#d1d5db' : '#374151'
              }}
              onMouseEnter={(e) => {
                if (!isRegenerating && !isLoading && payrolls.length > 0) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Period'}
            </Button>

            {/* Filters Button */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 h-10"
                style={{
                  backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                  borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                }}
              >
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 px-6">
            <Card 
              className="shadow-none"
              style={{
                backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
              }}
            >
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#9ca3af' }}
                  >Total Payroll</p>
                  <p 
                    className="text-2xl font-semibold leading-tight"
                    style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                  >
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

            <Card 
              className="shadow-none"
              style={{
                backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
              }}
            >
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#9ca3af' }}
                  >Total Workers</p>
                  <p 
                    className="text-2xl font-semibold leading-tight"
                    style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                  >
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

            <Card 
              className="shadow-none"
              style={{
                backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
              }}
            >
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#9ca3af' }}
                  >NIB Remittance</p>
                  <p 
                    className="text-2xl font-semibold leading-tight"
                    style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                  >
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

            <Card 
              className="shadow-none"
              style={{
                backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
              }}
            >
              <CardContent className="px-4 py-0">
                <div className="space-y-2">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#9ca3af' }}
                  >Balance</p>
                  <p 
                    className="text-2xl font-semibold leading-tight"
                    style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                  >
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                      minimumFractionDigits: 2,
                    }).format(currentPeriodData.totalUnpaid)}
                  </p>
                  <div className="flex items-center gap-1">
                    {currentPeriodData.totalUnpaid > 0 ? (
                      <AlertTriangle className="text-orange-600 dark:text-orange-600 h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="text-green-600 dark:text-green-600 h-4 w-4" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentPeriodData.totalUnpaid > 0
                        ? "text-orange-600 dark:text-orange-600"
                        : "text-green-600 dark:text-green-600"
                    }`}>
                      {currentPeriodData.totalUnpaid > 0 ? "Unpaid" : "Paid"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Payroll Table */}
        <div 
          className="border-t border-b flex-1 flex flex-col"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
            borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
          }}
        >
          <div className="px-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
                  <Table>
                    <TableHeader 
                      className="sticky top-0 z-50 shadow-sm"
                      style={{
                        backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                        borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                      }}
                    >
                      <TableRow 
                        style={{ 
                          backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                        }}
                        className="hover:bg-transparent"
                      >
                        <TableHead 
                          className="p-4 pl-8 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >
                          <Checkbox
                            color="var(--muted-foreground)"
                            checked={selectedPayrollIds.size === paginatedPayrolls.length && paginatedPayrolls.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(checked === true)}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Worker</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Hourly Rate</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Gross Pay</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >NIB Deduction</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Net Pay</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Amount Paid</TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >
                          <div className="flex items-center gap-2">
                            <span>Amount Owed</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel className="text-xs">View Options</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setRemainingBalanceView("net")}
                                  className="text-xs"
                                >
                                  Net Pay Only
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setRemainingBalanceView("gross")}
                                  className="text-xs"
                                >
                                  Gross Pay Only
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setRemainingBalanceView("both")}
                                  className="text-xs"
                                >
                                  Both Net & Gross
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="p-4 pb-4 font-medium text-sm text-gray-500"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Status</TableHead>
                        <TableHead 
                          className="p-4 pb-4 pr-6 font-medium text-sm text-gray-500 w-16"
                          style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                        >Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayrolls.length ? (
                        paginatedPayrolls.map((payroll) => (
                          <TableRow 
                            key={payroll.id} 
                            className="border-b last:border-b-0 transition-all duration-200"
                            style={{
                              borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <TableCell className="py-3 px-4 pl-8">
                              <Checkbox
                                color="var(--muted-foreground)"
                                checked={selectedPayrollIds.has(payroll.id)}
                                onCheckedChange={(checked) => handleSelectPayroll(payroll.id, checked === true)}
                                aria-label="Select payroll"
                              />
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div>
                                <div 
                                  className="font-medium"
                                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                                >{payroll.worker_name}</div>
                                <div 
                                  className="text-sm"
                                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                                >{payroll.position}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div 
                                className="font-medium"
                                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              >
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.hourly_rate)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div 
                                className="font-medium"
                                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              >
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.gross_pay)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div 
                                className="font-medium"
                                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              >
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.nib_deduction)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div 
                                className="font-medium"
                                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              >
                                {new Intl.NumberFormat("en-BS", {
                                  style: "currency",
                                  currency: "BSD",
                                  minimumFractionDigits: 2,
                                }).format(payroll.net_pay)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {(() => {
                                const totalPaid = payroll.total_paid || 0
                                const isEditing = editingPaymentAmount === payroll.id

                                if (isEditing) {
                                  return (
                                    <div className="space-y-2 min-w-[120px]">
                                        <Input
                                          type="number"
                                          value={paymentAmountValue}
                                          onChange={(e) => setPaymentAmountValue(e.target.value)}
                                          className="w-full h-8 text-center text-sm border-muted/50 focus:border-primary"
                                          step="1"
                                          min="0"
                                          placeholder="0"
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
                                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors w-full justify-start"
                                          style={{
                                            backgroundColor: theme === 'dark' ? '#262626' : 'rgb(249 250 251)',
                                            border: `1px solid ${theme === 'dark' ? '#404040' : 'rgb(229 231 235)'}`,
                                            color: theme === 'dark' ? '#9ca3af' : '#4b5563',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                                            e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#374151'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                            e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#4b5563'
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Set Amount
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePaymentAmountEdit(payroll.id, totalPaid.toString())}
                                          className="font-medium cursor-pointer"
                                          style={{ 
                                            color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = theme === 'dark' ? '#e5e7eb' : '#111827'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280'
                                          }}
                                        >
                                          {new Intl.NumberFormat("en-BS", {
                                            style: "currency",
                                            currency: "BSD",
                                            minimumFractionDigits: 2,
                                          }).format(totalPaid)}
                                        </button>
                                      )
                                    ) : (
                                      <span 
                                        className="font-medium"
                                        style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                                      >
                                        {totalPaid === 0 ? (
                                          <button
                                            onClick={handlePendingPayrollClick}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer"
                                            style={{
                                              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'rgb(249 250 251)',
                                              border: `1px solid ${theme === 'dark' ? '#404040' : 'rgb(229 231 235)'}`,
                                              color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246)'
                                              e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280'
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f1f1f' : 'rgb(249 250 251)'
                                              e.currentTarget.style.color = theme === 'dark' ? '#6b7280' : '#9ca3af'
                                            }}
                                          >
                                            <Plus className="w-4 h-4" />
                                            Set Amount
                                          </button>
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
                            <TableCell className="py-3 px-4">
                              {(() => {
                                const totalPaid = payroll.total_paid || 0
                                const isEditing = editingPaymentAmount === payroll.id
                                
                                // Use current input value if editing, otherwise use saved totalPaid
                                const currentAmount = isEditing ? (parseFloat(paymentAmountValue) || 0) : totalPaid
                                
                                const grossRemaining = Math.max(0, payroll.gross_pay - currentAmount)
                                const netRemaining = Math.max(0, payroll.net_pay - currentAmount)
                                const isFullyPaid = currentAmount >= payroll.gross_pay

                                return (
                                  <div className="space-y-1">
                                    {isFullyPaid ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Fully Paid</span>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {/* Show based on selected view */}
                                        {(remainingBalanceView === "net" || remainingBalanceView === "both") && (
                                          <div className="flex items-center gap-1">
                                            <span 
                                              className="text-lg font-bold"
                                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                                            >
                                              {new Intl.NumberFormat("en-BS", {
                                                style: "currency",
                                                currency: "BSD",
                                                minimumFractionDigits: 0,
                                              }).format(netRemaining)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {(remainingBalanceView === "gross" || (remainingBalanceView === "both" && grossRemaining !== netRemaining)) && (
                                          <div className="flex items-center gap-1">
                                            <span 
                                              className="text-xs"
                                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                                            >Gross:</span>
                                            <span 
                                              className="text-lg font-bold"
                                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                                            >
                                              {new Intl.NumberFormat("en-BS", {
                                                style: "currency",
                                                currency: "BSD",
                                                minimumFractionDigits: 0,
                                              }).format(grossRemaining)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="font-medium text-gray-500">
                                {getStatusBadge(payroll.status)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 pr-6 w-16">
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
                                <DropdownMenuContent align="end" className="w-48">
                                  {payroll.status === "pending" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPayrollIds(new Set([payroll.id]))
                                        handlePreviewAndConfirm()
                                      }}
                                      className="text-gray-500 focus:text-gray-500"
                                    >
                                      Confirm Payroll
                                    </DropdownMenuItem>
                                  )}
                                  {payroll.status === "confirmed" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedPayrollIds(new Set([payroll.id]))
                                          handleMarkAsPaid()
                                        }}
                                        className="text-gray-500 focus:text-gray-500"
                                      >
                                        Mark as Paid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleReverseStatus(payroll.id, "pending")}
                                        className="text-amber-600 focus:text-amber-600"
                                      >
                                        Revert to Pending
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {payroll.status === "paid" && (
                                    <DropdownMenuItem
                                      onClick={() => handleReverseStatus(payroll.id, "confirmed")}
                                      className="text-amber-600 focus:text-amber-600"
                                    >
                                      Revert to Confirmed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePayroll(payroll.id)}
                                    className="text-gray-500 focus:text-gray-500"
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
                          <TableCell colSpan={10} className="h-32 text-center py-3 px-4">
                            <div className="flex flex-col items-center justify-center space-y-3 py-8">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)' }}
                              >
                                <svg 
                                  className="w-6 h-6" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="space-y-1">
                                <p 
                                  className="text-sm max-w-sm"
                                  style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                                >
                                  {selectedStatus !== "all" 
                                    ? `No payroll records with "${selectedStatus}" status for the selected period.`
                                    : "No payroll records found for the selected date range. Try adjusting your filters or date range."
                                  }
                                </p>
                              </div>
                              {selectedStatus !== "all" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedStatus("all")}
                                  className="text-xs"
                                >
                                  Clear Status Filter
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
              </div>

            {/* Pagination Controls */}
            {filteredPayrolls.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-6 py-4">
                <div 
                  className="text-sm"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
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
                            ? "bg-muted text-gray-800 border-muted dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500"
                            : "hover:bg-muted dark:hover:bg-gray-600 dark:hover:text-gray-100"
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
                  <div className="text-sm font-medium text-gray-500">Amount Owed</div>
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
                  
                  {/* Amount Owed Display */}
                  {modalPayroll && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Owed</div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Gross Pay Amount Owed */}
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Gross Pay</div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(Math.max(0, modalPayroll.gross_pay - (payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) + (parseFloat(newAmount) || 0))))}
                            </div>
                            {Math.max(0, modalPayroll.gross_pay - (payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) + (parseFloat(newAmount) || 0))) <= 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </div>
                        
                        {/* Net Pay Amount Owed */}
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Net Pay</div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(Math.max(0, modalPayroll.net_pay - (payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) + (parseFloat(newAmount) || 0))))}
                            </div>
                            {Math.max(0, modalPayroll.net_pay - (payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) + (parseFloat(newAmount) || 0))) <= 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Current Payment Preview */}
                      {newAmount && parseFloat(newAmount) > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="text-xs text-gray-500 mb-1">Payment Preview</div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Adding:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(parseFloat(newAmount))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
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

      {/* Confirm Payroll Modal */}
      <Dialog open={showConfirmPayrollModal} onOpenChange={setShowConfirmPayrollModal}>
        <DialogContent className="w-80 max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Payroll First
            </DialogTitle>
            <DialogDescription>
              Please confirm the payroll before setting payment amounts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Payroll must be confirmed before payment amounts can be set.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmPayrollModal(false)}>
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
