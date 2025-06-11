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
import type { PayrollRecord } from "@/lib/types/payroll"
import { fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { User } from "@supabase/supabase-js"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

export default function PayrollPage({ user }: { user: User }) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  useEffect(() => {
    loadPayroll();
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange])

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const filters: { date_from?: string; date_to?: string } = {};

      if (dateRange?.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange?.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await getPayrolls(filters);
      setPayrolls(response.data || []);
      console.log("Payroll:", payrolls)
      setLoading(false);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
      setLoading(false);
    }
  }

  const loadWorkers = async () => {
    setLoading(true)
    try {
      const data = await fetchWorkersForCompany(user.id);
      setWorkers(data)
    } catch (error) {
      console.log("Failed to fetch Workers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary data from payrolls
  const totalGrossPay = payrolls.reduce((sum, record) => sum + record.grossPay, 0)
  const totalDeductions = payrolls.reduce((sum, record) => sum + record.totalDeductions, 0)
  const totalNetPay = payrolls.reduce((sum, record) => sum + record.netPay, 0)
  const totalHours = payrolls.reduce((sum, record) => sum + record.totalHours, 0)
  const totalOvertimeHours = payrolls.reduce((sum, record) => sum + record.overtimeHours, 0)
  const totalNibDeductions = payrolls.reduce((sum, record) => sum + record.nibDeduction, 0)
  const totalOtherDeductions = payrolls.reduce((sum, record) => sum + record.otherDeductions, 0)

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
              <PayrollFilters workers={workers} date={dateRange} setDate={setDateRange} />
            </CardContent>
          </Card>

          {loading ? (
            <PayrollTableSkeleton />
          ) : (
            <PayrollTable data={payrolls} />
          )}
        </div>

        <div className="space-y-6">
          <PayrollSummary data={summaryData} />
          <NibComplianceCard
            totalNibContributions={totalNibDeductions}
            employeeCount={payrolls.length}
            payPeriod="Weekly: Dec 4-10, 2023"
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
