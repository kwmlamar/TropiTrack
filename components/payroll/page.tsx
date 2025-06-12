"use client"

import { useState, useEffect } from "react"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { PayrollFilters } from "@/components/payroll/payroll-filters"
import { PayrollTable } from "@/components/payroll/payroll-table"
import { PayrollSummary } from "@/components/payroll/payroll-summary"
import { PayrollActions } from "@/components/payroll/payroll-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NibComplianceCard } from "@/components/payroll/nib-compliance-card"
import { getPayrolls } from "@/lib/data/payroll"
import type { PayrollRecord } from "@/lib/types"
import { fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { User } from "@supabase/supabase-js"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { updatePayrollStatus } from "@/lib/data/payroll"
import { toast } from "sonner"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

export default function PayrollPage({ user }: { user: User }) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [payPeriodType, setPayPeriodType] = useState<string>("bi-weekly")
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<string>>(new Set())

  const {
    loading: settingsLoading,
    paymentSchedule,
    payrollSettings,
    deductionRules,
    calculateDeductions,
    getDefaultPayPeriod,
  } = usePayrollSettings()

  useEffect(() => {
    if (!settingsLoading) {
      setPayPeriodType(getDefaultPayPeriod())
    }
  }, [settingsLoading, getDefaultPayPeriod])

  useEffect(() => {
    loadPayroll()
    loadWorkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange, payPeriodType])

  const loadPayroll = async () => {
    setLoading(true)
    try {
      const filters: { date_from?: string; date_to?: string } = {}

      if (dateRange?.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange?.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await getPayrolls(filters)
      if (response.data) {
        // Apply deductions based on settings
        const processedPayrolls = response.data.map(payroll => {
          const overtimePay = payroll.overtime_hours * (payroll.hourly_rate * (payrollSettings?.overtime_rate || 1.5))
          const { nibDeduction, otherDeductions } = calculateDeductions(payroll.gross_pay, overtimePay)
          
          return {
            ...payroll,
            nib_deduction: nibDeduction,
            other_deductions: otherDeductions,
            total_deductions: nibDeduction + otherDeductions,
            net_pay: payroll.gross_pay - (nibDeduction + otherDeductions),
          }
        })
        setPayrolls(processedPayrolls)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      setLoading(false)
    }
  }

  const loadWorkers = async () => {
    setLoading(true)
    try {
      const data = await fetchWorkersForCompany(user.id)
      setWorkers(data)
    } catch (error) {
      console.log("Failed to fetch Workers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary data from payrolls
  const totalGrossPay = payrolls.reduce((sum, record) => sum + record.gross_pay, 0)
  const totalDeductions = payrolls.reduce((sum, record) => sum + record.total_deductions, 0)
  const totalNetPay = payrolls.reduce((sum, record) => sum + record.net_pay, 0)
  const totalHours = payrolls.reduce((sum, record) => sum + record.total_hours, 0)
  const totalOvertimeHours = payrolls.reduce((sum, record) => sum + record.overtime_hours, 0)
  const totalNibDeductions = payrolls.reduce((sum, record) => sum + record.nib_deduction, 0)
  const totalOtherDeductions = payrolls.reduce((sum, record) => sum + record.other_deductions, 0)

  const summaryData = {
    totalEmployees: payrolls.length,
    totalHours,
    totalOvertimeHours,
    totalGrossPay,
    totalNibDeductions,
    totalOtherDeductions,
    totalDeductions,
    totalNetPay,
  }

  const handleMarkAsPaid = async () => {
    if (selectedPayrollIds.size === 0) {
      return
    }

    const payrollIdsToUpdate = Array.from(selectedPayrollIds)
    const result = await updatePayrollStatus(payrollIdsToUpdate, "paid")

    if (result.success) {
      toast.success("Selected payrolls marked as paid.")
      setSelectedPayrollIds(new Set())
      loadPayroll() // Refresh payroll data
    } else {
      toast.error("Failed to mark payrolls as paid.", {
        description: result.error || "An unknown error occurred.",
      })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <PayrollHeader />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6 overflow-x-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <PayrollFilters
                workers={workers}
                date={dateRange}
                setDate={setDateRange}
                setPayPeriodType={setPayPeriodType}
                payPeriodType={payPeriodType}
                paymentSchedule={paymentSchedule}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">Payroll Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {payPeriodType.charAt(0).toUpperCase() + payPeriodType.slice(1)} Payroll:
                  {dateRange?.from && dateRange?.to
                    ? ` ${format(dateRange.from, "MMM d")}-${format(dateRange.to, "MMM d, yyyy")}`
                    : " Select a date range"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleMarkAsPaid}
                disabled={selectedPayrollIds.size === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            </CardHeader>
            <CardContent className="px-6">
              {loading || settingsLoading ? (
                <PayrollTableSkeleton />
              ) : (
                <PayrollTable
                  data={payrolls}
                  selectedPayrollIds={selectedPayrollIds}
                  setSelectedPayrollIds={setSelectedPayrollIds}
                  deductionRules={deductionRules}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PayrollSummary data={summaryData} />
          <NibComplianceCard
            totalNibContributions={totalNibDeductions}
            employeeCount={payrolls.length}
            payPeriod={dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}` : "N/A"}
            nibRate={payrollSettings?.nib_rate}
          />
          <PayrollActions />
        </div>
      </div>
    </div>
  )
}

function PayrollTableSkeleton() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
