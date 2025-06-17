"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
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

  const getDateRange = () => {
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
  }

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
  }, [viewMode, selectedDate])

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!payrollData) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
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
        <CardTitle>Payroll Summary</CardTitle>
        <CardDescription>{getPeriodDescription()} pay period ({formatDate(payrollData.pay_period_start)}-{formatDate(payrollData.pay_period_end)})</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Pay</span>
            <span className="font-medium">${payrollData.gross_pay.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">NIB Contributions</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">${payrollData.nib_deduction.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Other Deductions</span>
            <span className="font-medium text-red-600 dark:text-red-400">${payrollData.other_deductions.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-center justify-between font-medium">
              <span>Net Pay</span>
              <span className="text-green-600 dark:text-green-400">${payrollData.net_pay.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <Button className="w-full gap-2">
          <DollarSign className="h-4 w-4" />
          <span>Process Payroll</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
