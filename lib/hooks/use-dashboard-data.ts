import { useState, useEffect, useCallback } from 'react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { getUserProfileWithCompany } from '@/lib/data/userProfiles'
import { getTimesheetSummary } from '@/lib/data/timesheets'
import { getWorkers, getActiveWorkersCount } from '@/lib/data/workers'
import { getPayrolls } from '@/lib/data/payroll'
import { getProjects, getActiveProjectsCount } from '@/lib/data/projects'
import { usePayrollSettings } from './use-payroll-settings'

type ViewMode = "daily" | "weekly" | "monthly"

interface DashboardData {
  timesheetSummary: unknown
  previousTimesheetSummary: unknown
  workers: unknown[]
  currentActiveWorkersCount: number
  previousActiveWorkersCount: number
  payroll: unknown[]
  previousPayroll: unknown[]
  projects: unknown[]
  currentActiveProjectsCount: number
  previousActiveProjectsCount: number
  loading: boolean
  error: string | null
}

export function useDashboardData(viewMode: ViewMode, selectedDate: Date) {
  const [data, setData] = useState<DashboardData>({
    timesheetSummary: null,
    previousTimesheetSummary: null,
    workers: [],
    currentActiveWorkersCount: 0,
    previousActiveWorkersCount: 0,
    payroll: [],
    previousPayroll: [],
    projects: [],
    currentActiveProjectsCount: 0,
    previousActiveProjectsCount: 0,
    loading: true,
    error: null
  })
  
  const { paymentSchedule } = usePayrollSettings()

  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      const profile = await getUserProfileWithCompany()
      if (!profile) {
        setData(prev => ({ ...prev, loading: false, error: "Profile not found" }))
        return
      }

      // Get week start day from payment schedule
      const getWeekStartsOn = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
        if (paymentSchedule?.period_start_type === "day_of_week") {
          const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
            1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
          }
          return dayMap[paymentSchedule.period_start_day] || 6
        }
        return 6
      }

      // Calculate date ranges
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
          // Use rolling 30-day window instead of calendar month
          end = endOfDay(selectedDate)
          start = startOfDay(subDays(selectedDate, 29)) // 30 days including today
          break
      }

      const previousStart = new Date(start)
      const previousEnd = new Date(end)
      const periodLength = end.getTime() - start.getTime()
      previousStart.setTime(previousStart.getTime() - periodLength)
      previousEnd.setTime(previousEnd.getTime() - periodLength)

      // Fetch all data in parallel
      const [
        timesheetSummary,
        previousTimesheetSummary,
        workersResponse,
        currentActiveWorkersCount,
        previousActiveWorkersCount,
        payrollResponse,
        previousPayrollResponse,
        projectsResponse,
        currentActiveProjectsCount,
        previousActiveProjectsCount
      ] = await Promise.all([
        getTimesheetSummary(profile.id, {
          date_from: format(start, 'yyyy-MM-dd'),
          date_to: format(end, 'yyyy-MM-dd')
        }),
        getTimesheetSummary(profile.id, {
          date_from: format(previousStart, 'yyyy-MM-dd'),
          date_to: format(previousEnd, 'yyyy-MM-dd')
        }),
        getWorkers(profile.company_id, { is_active: true }),
        getActiveWorkersCount(profile.company_id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')),
        getActiveWorkersCount(profile.company_id, format(previousStart, 'yyyy-MM-dd'), format(previousEnd, 'yyyy-MM-dd')),
        // For dashboard stats, use regular payroll data (not aggregated)
        getPayrolls({
          date_from: format(start, 'yyyy-MM-dd'),
          date_to: format(end, 'yyyy-MM-dd')
        }),
        getPayrolls({
          date_from: format(previousStart, 'yyyy-MM-dd'),
          date_to: format(previousEnd, 'yyyy-MM-dd')
        }),
        getProjects(profile.company_id, { 
          is_active: true,
          status: "in_progress"
        }),
        getActiveProjectsCount(profile.company_id, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'), { 
          status: "in_progress"
        }),
        getActiveProjectsCount(profile.company_id, format(previousStart, 'yyyy-MM-dd'), format(previousEnd, 'yyyy-MM-dd'), { 
          status: "in_progress"
        })
      ])

      setData({
        timesheetSummary: timesheetSummary.data,
        previousTimesheetSummary: previousTimesheetSummary.data,
        workers: workersResponse.data || [],
        currentActiveWorkersCount: currentActiveWorkersCount.data || 0,
        previousActiveWorkersCount: previousActiveWorkersCount.data || 0,
        payroll: payrollResponse.data || [],
        previousPayroll: previousPayrollResponse.data || [],
        projects: projectsResponse.data || [],
        currentActiveProjectsCount: currentActiveProjectsCount.data || 0,
        previousActiveProjectsCount: previousActiveProjectsCount.data || 0,
        loading: false,
        error: null
      })

      // Debug payroll calculations
      console.log("[Dashboard] Current payroll data:", payrollResponse.data)
      console.log("[Dashboard] Current payroll total:", payrollResponse.data?.reduce((sum, p) => sum + p.gross_pay, 0) || 0)
      console.log("[Dashboard] Date range:", format(start, 'yyyy-MM-dd'), "to", format(end, 'yyyy-MM-dd'))
      console.log("[Dashboard] Using regular payroll data (not aggregated)")
      console.log("[Dashboard] Payroll records count:", payrollResponse.data?.length || 0)
      console.log("[Dashboard] Individual payroll records:", payrollResponse.data?.map(p => ({
        id: p.id,
        worker_name: p.worker_name,
        gross_pay: p.gross_pay,
        pay_period_start: p.pay_period_start,
        pay_period_end: p.pay_period_end,
        status: p.status
      })))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load data' 
      }))
    }
  }, [viewMode, selectedDate, paymentSchedule])

  useEffect(() => {
    loadData()
  }, [loadData])

  return data
} 