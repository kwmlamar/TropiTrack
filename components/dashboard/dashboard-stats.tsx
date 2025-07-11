"use client"

import { Clock, DollarSign, HardHat, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useCallback } from "react"
import { getTimesheetSummary } from "@/lib/data/timesheets"
import { getWorkers } from "@/lib/data/workers"
import { getAggregatedPayrolls } from "@/lib/data/payroll"
import { getProjects } from "@/lib/data/projects"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"

type ViewMode = "daily" | "weekly" | "monthly"

interface DashboardStatsProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function DashboardStats({ viewMode, selectedDate }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalHours: { value: 0, change: 0 },
    activeWorkers: { value: 0, change: 0 },
    payroll: { value: 0, change: 0 },
    activeProjects: { value: 0, change: 0 }
  })
  const [loading, setLoading] = useState(true)
  const { paymentSchedule } = usePayrollSettings()

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await getUserProfileWithCompany()
      if (!profile) return

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

      // Calculate date range directly within the function
      let start: Date, end: Date
      switch (viewMode) {
        case "daily":
          start = startOfDay(selectedDate)
          end = endOfDay(selectedDate)
          break
        case "weekly":
          start = startOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          end = endOfWeek(selectedDate, { weekStartsOn: getWeekStartsOn() })
          break
        case "monthly":
          start = startOfMonth(selectedDate)
          end = endOfMonth(selectedDate)
          break
      }

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

      // Fetch active projects
      const projectsResponse = await getProjects(profile.company_id, { 
        is_active: true,
        status: "in_progress"
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

      const currentProjects = projectsResponse.data?.length || 0
      const previousProjects = 0 // TODO: Implement previous period projects comparison
      const projectsChange = previousProjects ? ((currentProjects - previousProjects) / previousProjects) * 100 : 0

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
        },
        activeProjects: {
          value: currentProjects,
          change: projectsChange
        }
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [viewMode, selectedDate, paymentSchedule])

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
    const sign = change >= 0 ? "▲" : "▼"
    return `${sign}${Math.abs(change).toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-800 dark:text-green-600" : "text-red-800 dark:text-red-600"
  }

  const getTriangleStyle = (change: number) => {
    return change >= 0 ? "text-green-800 dark:text-green-600 text-xs" : "text-red-800 dark:text-red-600 text-xs"
  }

  const statsData = [
    {
      title: "Total Hours Tracked",
      value: Number.isInteger(stats.totalHours.value) ? stats.totalHours.value.toString() : stats.totalHours.value.toFixed(1),
      change: formatChange(stats.totalHours.change),
      changeColor: getChangeColor(stats.totalHours.change),
      trend: stats.totalHours.change >= 0 ? "up" : "down",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Active Workers",
      value: stats.activeWorkers.value.toString(),
      change: formatChange(stats.activeWorkers.change),
      changeColor: getChangeColor(stats.activeWorkers.change),
      trend: stats.activeWorkers.change >= 0 ? "up" : "down",
      icon: HardHat,
      color: "green",
    },
    {
      title: `Payroll for this ${viewMode === "daily" ? "Day" : viewMode === "weekly" ? "Week" : "Month"}`,
      value: formatCurrency(stats.payroll.value),
      change: formatChange(stats.payroll.change),
      changeColor: getChangeColor(stats.payroll.change),
      trend: stats.payroll.change >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "orange",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects.value.toString(),
      change: formatChange(stats.activeProjects.change),
      changeColor: getChangeColor(stats.activeProjects.change),
      trend: stats.activeProjects.change >= 0 ? "up" : "down",
      icon: Building2,
      color: "purple",
    }
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((_, index) => (
          <Card key={index} className="bg-[#E8EDF5] dark:bg-[#E8EDF5] border-0 shadow-none">
            <CardContent className="px-4 py-2">
              <div className="space-y-1">
                              <div className="h-3 w-20 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
              <div className="h-6 w-16 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[#D1D8E0] dark:bg-[#D1D8E0]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className="bg-[#E8EDF5] dark:bg-[#E8EDF5] border-0 shadow-none"
        >
          <CardContent className="px-4 py-0">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-500">{stat.title}</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-gray-900 leading-tight">{stat.value}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className={`${getTriangleStyle(stat.trend === "up" ? 1 : -1)}`}>
                    {stat.trend === "up" ? "▲" : "▼"}
                  </span>
                  <span className={`text-sm font-semibold ${stat.changeColor}`}> 
                    {Math.abs(stats[Object.keys(stats)[index] as keyof typeof stats].change).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-500 font-semibold">Last 30 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
