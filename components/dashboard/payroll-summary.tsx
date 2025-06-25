"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { getAggregatedPayrolls } from "@/lib/data/payroll"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = "daily" | "weekly" | "monthly"

interface PayrollSummaryProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function PayrollSummary({ viewMode, selectedDate }: PayrollSummaryProps) {
  const [payrollData, setPayrollData] = useState<{
    gross_pay: number
    nib_deduction: number
    other_deductions: number
    net_pay: number
    pay_period_start: string
    pay_period_end: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const getDateRange = useCallback(() => {
    switch (viewMode) {
      case "daily":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        }
      case "weekly":
        return {
          start: startOfWeek(selectedDate),
          end: endOfWeek(selectedDate)
        }
      case "monthly":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        }
    }
  }, [viewMode, selectedDate])

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setLoading(true)
        const { start, end } = getDateRange()

        const response = await getAggregatedPayrolls({
          date_from: format(start, "yyyy-MM-dd"),
          date_to: format(end, "yyyy-MM-dd"),
          target_period_type: viewMode === "daily" ? "weekly" : viewMode
        })

        if (response.success && response.data && response.data.length > 0) {
          // Aggregate the data
          const aggregated = response.data.reduce((acc, curr) => ({
            gross_pay: acc.gross_pay + curr.gross_pay,
            nib_deduction: acc.nib_deduction + curr.nib_deduction,
            other_deductions: acc.other_deductions + curr.other_deductions,
            net_pay: acc.net_pay + curr.net_pay,
            pay_period_start: curr.pay_period_start,
            pay_period_end: curr.pay_period_end
          }), {
            gross_pay: 0,
            nib_deduction: 0,
            other_deductions: 0,
            net_pay: 0,
            pay_period_start: "",
            pay_period_end: ""
          })

          setPayrollData(aggregated)
        } else {
          setPayrollData(null)
        }
      } catch (error) {
        console.error("Error fetching payroll data:", error)
        setPayrollData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollData()
  }, [getDateRange, viewMode])

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!payrollData) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="space-y-1">
            <CardTitle>Payroll Summary</CardTitle>
            <CardDescription>No data available</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mb-2 opacity-50" />
            <p className="font-medium">No Payroll Data</p>
            <p className="text-sm mt-1">No payroll data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d")
  }

  const getPeriodDescription = () => {
    switch (viewMode) {
      case "daily":
        return "Today's"
      case "weekly":
        return "This week's"
      case "monthly":
        return "This month's"
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>
            {getPeriodDescription()} pay period ({formatDate(payrollData.pay_period_start)}-{formatDate(payrollData.pay_period_end)})
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-muted-foreground">Gross Pay</span>
              <p className="text-sm text-muted-foreground">Total earnings before deductions</p>
            </div>
            <span className="text-lg font-semibold">${payrollData.gross_pay.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-muted-foreground">NIB Contributions</span>
              <p className="text-sm text-muted-foreground">National Insurance Board deductions</p>
            </div>
            <span className="text-lg font-semibold">${payrollData.nib_deduction.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-muted-foreground">Other Deductions</span>
              <p className="text-sm text-muted-foreground">Additional deductions and withholdings</p>
            </div>
            <span className="text-lg font-semibold">${payrollData.other_deductions.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">Net Pay</span>
              <p className="text-sm text-muted-foreground">Final amount after all deductions</p>
            </div>
            <span className="text-lg font-semibold">${payrollData.net_pay.toFixed(2)}</span>
          </div>
        </div>
        <Button className="w-full gap-2 transition-colors hover:bg-primary/90">
          <DollarSign className="h-4 w-4" />
          <span>Process Payroll</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
