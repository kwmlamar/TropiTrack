import { useState, useEffect, useCallback } from 'react'
import { format, endOfWeek } from 'date-fns'
import { getUserProfileWithCompany } from '@/lib/data/userProfiles'
import { getTimesheets } from '@/lib/data/timesheets'
import { getPayrolls } from '@/lib/data/payroll'
import { usePayrollSettings } from './use-payroll-settings'
import { useDateRange } from '@/context/date-range-context'

interface ProjectHours {
  project_id: string
  project_name: string
  total_hours: number
  percentage: number
}

interface WorkerHours {
  worker_id: string
  worker_name: string
  regular_hours: number
  overtime_hours: number
  total_hours: number
  regular_cost: number
  overtime_cost: number
  total_cost: number
}

interface ProjectCosts {
  project_id: string
  project_name: string
  total_hours: number
  total_cost: number
  avg_hourly_rate: number
}

interface ReportsData {
  // Summary tab data
  totalHours: number
  totalLaborCost: number
  overtimeHours: number
  overtimeWorkersCount: number
  projectHours: ProjectHours[]
  upcomingPayrollDate: string
  upcomingPayrollAmount: number
  
  // Detailed tab data
  workerHours: WorkerHours[]
  projectCosts: ProjectCosts[]
  workers: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string }>
  
  // Previous period for comparison
  previousTotalHours: number
  previousTotalLaborCost: number
  previousOvertimeHours: number
  
  // Loading and error states
  loading: boolean
  error: string | null
}

export function useReportsData() {
  const [data, setData] = useState<ReportsData>({
    totalHours: 0,
    totalLaborCost: 0,
    overtimeHours: 0,
    overtimeWorkersCount: 0,
    projectHours: [],
    upcomingPayrollDate: '',
    upcomingPayrollAmount: 0,
    workerHours: [],
    projectCosts: [],
    workers: [],
    projects: [],
    previousTotalHours: 0,
    previousTotalLaborCost: 0,
    previousOvertimeHours: 0,
    loading: true,
    error: null
  })

  const { dateRange } = useDateRange()
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

      // Calculate current period dates
      const currentStart = dateRange?.from || new Date()
      const currentEnd = dateRange?.to || new Date()

      // Calculate previous period dates
      const periodLength = currentEnd.getTime() - currentStart.getTime()
      const previousStart = new Date(currentStart.getTime() - periodLength)
      const previousEnd = new Date(currentEnd.getTime() - periodLength)

      // Fetch current period data
      const [timesheetsResponse, payrollResponse] = await Promise.all([
        getTimesheets(profile.id, {
          date_from: format(currentStart, 'yyyy-MM-dd'),
          date_to: format(currentEnd, 'yyyy-MM-dd')
        }),
        getPayrolls({
          date_from: format(currentStart, 'yyyy-MM-dd'),
          date_to: format(currentEnd, 'yyyy-MM-dd')
        })
      ])

      // Fetch previous period data for comparison
      const [previousTimesheetsResponse, previousPayrollResponse] = await Promise.all([
        getTimesheets(profile.id, {
          date_from: format(previousStart, 'yyyy-MM-dd'),
          date_to: format(previousEnd, 'yyyy-MM-dd')
        }),
        getPayrolls({
          date_from: format(previousStart, 'yyyy-MM-dd'),
          date_to: format(previousEnd, 'yyyy-MM-dd')
        })
      ])

      // Process current period data
      const timesheets = timesheetsResponse.data || []
      const payroll = payrollResponse.data || []

      // Calculate total hours
      const totalHours = timesheets.reduce((sum, timesheet) => {
        return sum + (timesheet.total_hours || 0)
      }, 0)

      // Calculate overtime hours and workers
      let overtimeHours = 0
      const overtimeWorkers = new Set<string>()
      
      timesheets.forEach(timesheet => {
        if (timesheet.total_hours > 8) { // Assuming 8 hours is standard
          overtimeHours += timesheet.total_hours - 8
          overtimeWorkers.add(timesheet.worker_id)
        }
      })

      // Calculate total labor cost
      const totalLaborCost = payroll.reduce((sum, record) => {
        return sum + (record.gross_pay || 0)
      }, 0)

      // Calculate project hours
      const projectHoursMap = new Map<string, { name: string; hours: number }>()
      
      timesheets.forEach(timesheet => {
        if (timesheet.project_id && timesheet.project) {
          const projectName = timesheet.project.name
          const currentHours = projectHoursMap.get(timesheet.project_id)?.hours || 0
          projectHoursMap.set(timesheet.project_id, {
            name: projectName,
            hours: currentHours + (timesheet.total_hours || 0)
          })
        }
      })

      // Convert to array and sort by hours
      const projectHours: ProjectHours[] = Array.from(projectHoursMap.entries())
        .map(([project_id, data]) => ({
          project_id,
          project_name: data.name,
          total_hours: data.hours,
          percentage: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
        }))
        .sort((a, b) => b.total_hours - a.total_hours)
        .slice(0, 3) // Top 3 projects

      // Calculate previous period data
      const previousTimesheets = previousTimesheetsResponse.data || []
      const previousPayroll = previousPayrollResponse.data || []

      const previousTotalHours = previousTimesheets.reduce((sum, timesheet) => {
        return sum + (timesheet.total_hours || 0)
      }, 0)

      const previousTotalLaborCost = previousPayroll.reduce((sum, record) => {
        return sum + (record.gross_pay || 0)
      }, 0)

      let previousOvertimeHours = 0
      previousTimesheets.forEach(timesheet => {
        if (timesheet.total_hours > 8) {
          previousOvertimeHours += timesheet.total_hours - 8
        }
      })

      // Calculate upcoming payroll date (next pay period)
      const upcomingPayrollDate = format(endOfWeek(new Date(), { weekStartsOn: getWeekStartsOn() }), 'EEEE, MMM d')
      const upcomingPayrollAmount = totalLaborCost // Use current period as estimate

      // Process detailed worker hours data
      const workerHoursMap = new Map<string, WorkerHours>()
      
      timesheets.forEach(timesheet => {
        const workerId = timesheet.worker_id
        const workerName = timesheet.worker?.name || 'Unknown Worker'
        const regularHours = timesheet.regular_hours || 0
        const overtimeHours = timesheet.overtime_hours || 0
        const totalHours = timesheet.total_hours || 0
        const hourlyRate = timesheet.worker?.hourly_rate || 0
        
        if (workerHoursMap.has(workerId)) {
          const existing = workerHoursMap.get(workerId)!
          existing.regular_hours += regularHours
          existing.overtime_hours += overtimeHours
          existing.total_hours += totalHours
          existing.regular_cost += regularHours * hourlyRate
          existing.overtime_cost += overtimeHours * hourlyRate * 1.5
          existing.total_cost += (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5)
        } else {
          workerHoursMap.set(workerId, {
            worker_id: workerId,
            worker_name: workerName,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
            total_hours: totalHours,
            regular_cost: regularHours * hourlyRate,
            overtime_cost: overtimeHours * hourlyRate * 1.5,
            total_cost: (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5)
          })
        }
      })

      const workerHours = Array.from(workerHoursMap.values())

      // Process detailed project costs data
      const projectCostsMap = new Map<string, ProjectCosts>()
      
      timesheets.forEach(timesheet => {
        if (timesheet.project_id && timesheet.project) {
          const projectId = timesheet.project_id
          const projectName = timesheet.project.name
          const totalHours = timesheet.total_hours || 0
          const hourlyRate = timesheet.worker?.hourly_rate || 0
          const cost = totalHours * hourlyRate
          
          if (projectCostsMap.has(projectId)) {
            const existing = projectCostsMap.get(projectId)!
            existing.total_hours += totalHours
            existing.total_cost += cost
            existing.avg_hourly_rate = existing.total_cost / existing.total_hours
          } else {
            projectCostsMap.set(projectId, {
              project_id: projectId,
              project_name: projectName,
              total_hours: totalHours,
              total_cost: cost,
              avg_hourly_rate: hourlyRate
            })
          }
        }
      })

      const projectCosts = Array.from(projectCostsMap.values())

      // Extract workers and projects for filters
      const workersList = Array.from(workerHoursMap.values()).map(wh => ({
        id: wh.worker_id,
        name: wh.worker_name
      }))

      const projectsList = Array.from(projectCostsMap.values()).map(pc => ({
        id: pc.project_id,
        name: pc.project_name
      }))

      setData({
        totalHours,
        totalLaborCost,
        overtimeHours,
        overtimeWorkersCount: overtimeWorkers.size,
        projectHours,
        upcomingPayrollDate,
        upcomingPayrollAmount,
        workerHours,
        projectCosts,
        workers: workersList,
        projects: projectsList,
        previousTotalHours,
        previousTotalLaborCost,
        previousOvertimeHours,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Failed to load reports data:', error)
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load data' 
      }))
    }
  }, [dateRange, paymentSchedule])

  useEffect(() => {
    loadData()
  }, [loadData])

  return data
}
