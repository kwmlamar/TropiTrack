"use client"

import { Clock, DollarSign, HardHat } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { getTimesheetSummary } from "@/lib/data/timesheets"
import { getWorkers } from "@/lib/data/workers"
import { getAggregatedPayrolls } from "@/lib/data/payroll"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

type ViewMode = "daily" | "weekly" | "monthly"

interface DashboardStatsProps {
  viewMode: ViewMode
  selectedDate: Date
  isLoading: boolean
}

export function DashboardStats({ viewMode, selectedDate }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalHours: { value: 0, change: 0 },
    activeWorkers: { value: 0, change: 0 },
    payroll: { value: 0, change: 0 }
  })
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

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await getUserProfileWithCompany()
      if (!profile) return

      const { start, end } = getDateRange()

      // Fetch timesheet summary
      const timesheetSummary = await getTimesheetSummary(profile.id, {
        date_from: format(start, 'yyyy-MM-dd'),
        date_to: format(end, 'yyyy-MM-dd')
      })

      // Fetch previous period's timesheet summary for comparison
      const previousStart = new Date(start)
      const previousEnd = new Date(end)
      const periodLength = end.getTime() - start.getTime()
      previousStart.setTime(previousStart.getTime() - periodLength)
      previousEnd.setTime(previousEnd.getTime() - periodLength)

      const previousTimesheetSummary = await getTimesheetSummary(profile.id, {
        date_from: format(previousStart, 'yyyy-MM-dd'),
        date_to: format(previousEnd, 'yyyy-MM-dd')
      })

      // Fetch workers
      const workersResponse = await getWorkers(profile.company_id, { is_active: true })
      const previousWorkersResponse = await getWorkers(profile.company_id, { 
        is_active: true
      })

      // Fetch payroll data
      const payrollResponse = await getAggregatedPayrolls({
        date_from: format(start, 'yyyy-MM-dd'),
        date_to: format(end, 'yyyy-MM-dd'),
        target_period_type: viewMode === "daily" ? "weekly" : viewMode
      })

      // Calculate stats
      const currentHours = timesheetSummary.data?.totalHours || 0
      const previousHours = previousTimesheetSummary.data?.totalHours || 0
      const hoursChange = previousHours ? ((currentHours - previousHours) / previousHours) * 100 : 0

      const currentWorkers = workersResponse.data?.length || 0
      const previousWorkers = previousWorkersResponse.data?.length || 0
      const workersChange = previousWorkers ? ((currentWorkers - previousWorkers) / previousWorkers) * 100 : 0

      const currentPayroll = payrollResponse.data?.reduce((sum, p) => sum + p.gross_pay, 0) || 0
      const previousPayroll = 0 // TODO: Implement previous period payroll comparison
      const payrollChange = previousPayroll ? ((currentPayroll - previousPayroll) / previousPayroll) * 100 : 0

      setStats({
        totalHours: {
          value: currentHours,
          change: hoursChange
        },
        activeWorkers: {
          value: currentWorkers,
          change: workersChange
        },
        payroll: {
          value: currentPayroll,
          change: payrollChange
        }
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [getDateRange, viewMode])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(1)}%`
  }

  const statsData = [
    {
      title: "Total Hours Tracked",
      value: Number.isInteger(stats.totalHours.value) ? stats.totalHours.value.toString() : stats.totalHours.value.toFixed(1),
      change: formatChange(stats.totalHours.change),
      trend: stats.totalHours.change >= 0 ? "up" : "down",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Active Workers",
      value: stats.activeWorkers.value.toString(),
      change: formatChange(stats.activeWorkers.change),
      trend: stats.activeWorkers.change >= 0 ? "up" : "down",
      icon: HardHat,
      color: "green",
    },
    {
      title: `Payroll for this ${viewMode === "daily" ? "Day" : viewMode === "weekly" ? "Week" : "Month"}`,
      value: formatCurrency(stats.payroll.value),
      change: formatChange(stats.payroll.change),
      trend: stats.payroll.change >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "orange",
    }
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsData.map((_, index) => (
          <Card key={index} className="border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm transition-all duration-200">
            <CardContent className="px-6 py-4">
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
                <div className="h-8 w-32 animate-pulse rounded bg-muted/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className="group border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80"
        >
          <CardContent className="px-6 py-4">
            <div className="space-y-2">
              <p className="text-base font-medium text-primary dark:text-foreground">{stat.title}</p>
              <p className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
