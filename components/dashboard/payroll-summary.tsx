"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ChevronDown } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { getPayrolls } from "@/lib/data/payroll"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ViewMode = "weekly" | "monthly"

interface ChartDataPoint {
  date: string
  gross_pay: number
  net_pay: number
  nib_deduction: number
  other_deductions: number
}

export function PayrollSummary() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")
  const { paymentSchedule } = usePayrollSettings()

  const getDateRange = useCallback(() => {
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

    switch (viewMode) {
      case "weekly":
        return {
          start: startOfWeek(new Date(new Date().getTime() - 11 * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: getWeekStartsOn() }), // 12 weeks ago
          end: endOfWeek(new Date(), { weekStartsOn: getWeekStartsOn() })
        }
      case "monthly":
        return {
          start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1), // 6 months ago
          end: endOfMonth(new Date())
        }

    }
  }, [viewMode, paymentSchedule])

  const generateTimeSeriesData = useCallback(async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
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

      // Fetch all payroll data for the entire date range in one call
      const response = await getPayrolls({
        date_from: format(start, "yyyy-MM-dd"),
        date_to: format(end, "yyyy-MM-dd")
      })

      console.log("[PayrollSummary] All payroll data:", response.data)
      console.log("[PayrollSummary] Date range:", format(start, "yyyy-MM-dd"), "to", format(end, "yyyy-MM-dd"))
      console.log("[PayrollSummary] Total payroll records:", response.data?.length || 0)

      if (!response.success || !response.data) {
        setChartData([])
        return
      }

      // Generate data points based on view mode
      const dataPoints: ChartDataPoint[] = []
      let currentDate = new Date(start)
      const endDate = new Date(end)
      
      while (currentDate <= endDate) {
        let periodStart: Date
        let periodEnd: Date
        let dateLabel: string

        switch (viewMode) {
          case "weekly":
            periodStart = startOfWeek(currentDate, { weekStartsOn: getWeekStartsOn() })
            periodEnd = endOfWeek(currentDate, { weekStartsOn: getWeekStartsOn() })
            dateLabel = format(currentDate, "MMM dd")
            break
          case "monthly":
            periodStart = startOfMonth(currentDate)
            periodEnd = endOfMonth(currentDate)
            dateLabel = format(currentDate, "MMM yyyy")
            break
        }

        // Filter payroll data for this period - use created_at as fallback
        const periodPayrolls = response.data.filter((payroll: unknown) => {
          const payrollRecord = payroll as { pay_period_start?: string; created_at?: string }
          const payrollDate = new Date(payrollRecord.pay_period_start || payrollRecord.created_at || new Date())
          return payrollDate >= periodStart && payrollDate <= periodEnd
        })

        console.log(`[PayrollSummary] ${dateLabel} period:`, format(periodStart, "yyyy-MM-dd"), "to", format(periodEnd, "yyyy-MM-dd"))
        console.log(`[PayrollSummary] ${dateLabel} period payrolls:`, periodPayrolls.length)
        if (periodPayrolls.length > 0) {
          console.log(`[PayrollSummary] ${dateLabel} sample payroll:`, periodPayrolls[0])
        }

        if (periodPayrolls.length > 0) {
          const aggregated = periodPayrolls.reduce((sum: { gross_pay: number; nib_deduction: number; other_deductions: number; net_pay: number }, p: unknown) => {
            const payrollRecord = p as { gross_pay: number; nib_deduction: number; other_deductions: number; net_pay: number }
            return {
              gross_pay: sum.gross_pay + payrollRecord.gross_pay,
              nib_deduction: sum.nib_deduction + payrollRecord.nib_deduction,
              other_deductions: sum.other_deductions + payrollRecord.other_deductions,
              net_pay: sum.net_pay + payrollRecord.net_pay,
            }
          }, {
            gross_pay: 0,
            nib_deduction: 0,
            other_deductions: 0,
            net_pay: 0,
          })

          dataPoints.push({
            date: dateLabel,
            gross_pay: aggregated.gross_pay,
            net_pay: aggregated.net_pay,
            nib_deduction: aggregated.nib_deduction,
            other_deductions: aggregated.other_deductions,
          })
        } else {
          dataPoints.push({
            date: dateLabel,
            gross_pay: 0,
            net_pay: 0,
            nib_deduction: 0,
            other_deductions: 0,
          })
        }

        // Move to next period
        switch (viewMode) {
          case "weekly":
            currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case "monthly":
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            break
        }
      }

      setChartData(dataPoints)
      console.log("[PayrollSummary] Chart data:", dataPoints)
    } catch (error) {
      console.error("[PayrollSummary] Error fetching payroll data:", error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [viewMode, getDateRange, paymentSchedule])

  useEffect(() => {
    generateTimeSeriesData()
  }, [generateTimeSeriesData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  interface TooltipProps {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      color: string
    }>
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomLegend = (props: unknown) => {
    const { payload } = props as { payload?: Array<{ value: string; color: string }> }
    return (
      <div className="flex justify-center gap-4 mt-2">
        {payload?.map((entry: { value: string; color: string }, index: number) => (
          <div key={index} className="flex items-center gap-2 text-gray-500">
            <div 
              className="w-3 h-0.5" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader className="pb-2">
          <div className="space-y-1">
            <div className="h-7 w-40 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            <div className="h-4 w-60 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
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

  const getPeriodDescription = () => {
    switch (viewMode) {
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"

    }
  }

  return (
    <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-medium">Payroll</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shadow-none text-gray-600 hover:text-gray-700">
                {getPeriodDescription()}
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewModeChange("weekly")}>
                Weekly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewModeChange("monthly")}>
                Monthly
              </DropdownMenuItem>
              
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line 
                type="monotone" 
                dataKey="gross_pay" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Gross Pay"
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="net_pay" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Net Pay"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="nib_deduction" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="NIB Deductions"
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
