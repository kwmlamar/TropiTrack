"use client"

import { Clock, DollarSign, HardHat, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getTimesheetSummary } from "@/lib/data/timesheets"
import { getWorkers } from "@/lib/data/workers"
import { getAggregatedPayrolls } from "@/lib/data/payroll"
import { format } from "date-fns"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalHours: { value: 0, change: 0 },
    activeWorkers: { value: 0, change: 0 },
    payroll: { value: 0, change: 0 },
    projectCompletion: { value: 0, change: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const profile = await getUserProfileWithCompany()
      if (!profile) return

      // Get current date and previous period for comparison
      const now = new Date()

      // Fetch timesheet summary
      const timesheetSummary = await getTimesheetSummary(profile.id, {
        date_from: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
        date_to: format(now, 'yyyy-MM-dd')
      })

      // Fetch previous month's timesheet summary for comparison
      const previousTimesheetSummary = await getTimesheetSummary(profile.id, {
        date_from: format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd'),
        date_to: format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd')
      })

      // Fetch workers
      const workersResponse = await getWorkers(profile.company_id, { is_active: true })
      const previousWorkersResponse = await getWorkers(profile.company_id, { 
        is_active: true
      })

      // Fetch payroll data
      const payrollResponse = await getAggregatedPayrolls({
        date_from: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
        date_to: format(now, 'yyyy-MM-dd'),
        target_period_type: "monthly"
      })

      // Calculate stats
      const currentHours = timesheetSummary.data?.totalHours || 0
      const previousHours = previousTimesheetSummary.data?.totalHours || 0
      const hoursChange = previousHours ? ((currentHours - previousHours) / previousHours) * 100 : 0

      const currentWorkers = workersResponse.data?.length || 0
      const previousWorkers = previousWorkersResponse.data?.length || 0
      const workersChange = previousWorkers ? ((currentWorkers - previousWorkers) / previousWorkers) * 100 : 0

      const currentPayroll = payrollResponse.data?.reduce((sum, p) => sum + p.gross_pay, 0) || 0
      const previousPayroll = 0 // TODO: Implement previous month payroll comparison
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
        },
        projectCompletion: {
          value: 0, // TODO: Implement project completion tracking
          change: 0
        }
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

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
      title: "Total Hours",
      value: stats.totalHours.value.toFixed(1),
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
      title: "Payroll This Month",
      value: formatCurrency(stats.payroll.value),
      change: formatChange(stats.payroll.change),
      trend: stats.payroll.change >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "orange",
    },
    {
      title: "Project Completion",
      value: `${stats.projectCompletion.value}%`,
      change: formatChange(stats.projectCompletion.change),
      trend: stats.projectCompletion.change >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "purple",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((_, index) => (
          <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={`p-2 ${
                stat.color === "blue"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : stat.color === "green"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : stat.color === "orange"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
              } rounded-lg`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground truncate">{stat.value}</p>
                  <span className={`text-xs font-medium whitespace-nowrap ${stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
