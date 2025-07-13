"use client"

import { Clock, DollarSign, HardHat, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"

type ViewMode = "daily" | "weekly" | "monthly"

interface DashboardStatsProps {
  viewMode: ViewMode
  selectedDate: Date
}

export function DashboardStats({ viewMode, selectedDate }: DashboardStatsProps) {
  const { timesheetSummary, previousTimesheetSummary, workers, payroll, previousPayroll, projects, previousActiveWorkersCount, previousActiveProjectsCount, loading, error } = useDashboardData(viewMode, selectedDate)

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

  // Calculate stats from shared data
  const currentHours = ((timesheetSummary as unknown) as { totalHours?: number })?.totalHours || 0
  const previousHours = ((previousTimesheetSummary as unknown) as { totalHours?: number })?.totalHours || 0
  const hoursChange = previousHours ? ((currentHours - previousHours) / previousHours) * 100 : 0

  const currentWorkers = workers.length || 0
  const previousWorkersCount = previousActiveWorkersCount || 0
  const workersChange = previousWorkersCount ? ((currentWorkers - previousWorkersCount) / previousWorkersCount) * 100 : 0

  const currentPayroll = (payroll as unknown[])?.reduce((sum: number, p: unknown) => sum + ((p as { gross_pay?: number })?.gross_pay || 0), 0) || 0
  const previousPayrollTotal = (previousPayroll as unknown[])?.reduce((sum: number, p: unknown) => sum + ((p as { gross_pay?: number })?.gross_pay || 0), 0) || 0
  const payrollChange = previousPayrollTotal ? ((currentPayroll - previousPayrollTotal) / previousPayrollTotal) * 100 : 0

  const currentProjects = (projects as unknown[])?.length || 0
  const previousProjectsCount = previousActiveProjectsCount || 0
  const projectsChange = previousProjectsCount ? ((currentProjects - previousProjectsCount) / previousProjectsCount) * 100 : 0

  const stats = {
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
  }

  const getTimePeriodLabel = (viewMode: ViewMode) => {
    switch (viewMode) {
      case "daily":
        return "Today"
      case "weekly":
        return "This week"
      case "monthly":
        return "Last 30 days"
      default:
        return "Last 30 days"
    }
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
      title: `Payroll for ${getTimePeriodLabel(viewMode)}`,
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

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-4 bg-red-50 border-red-200">
          <CardContent className="px-4 py-2">
            <p className="text-red-600 text-sm">Error loading dashboard stats: {error}</p>
          </CardContent>
        </Card>
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
                <span className="text-xs text-gray-500 dark:text-gray-500 font-semibold">{getTimePeriodLabel(viewMode)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
