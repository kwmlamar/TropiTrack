"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from "lucide-react"
import { useReportsTabs } from "@/context/reports-tabs-context"
import { useReportsData } from "@/lib/hooks/use-reports-data"
import { useDateRange } from "@/context/date-range-context"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { useState } from "react"

export default function ReportsPageClient() {
  const { activeTab } = useReportsTabs()
  const reportsData = useReportsData()
  const { dateRange, setDateRange } = useDateRange()
  
  // State for multiselect filters
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const handlePreviousPeriod = () => {
    // Move to previous week (same logic as timesheets page)
    const newDate = new Date(dateRange.from)
    newDate.setDate(dateRange.from.getDate() - 7)
    const weekStart = startOfWeek(newDate, { weekStartsOn: 6 }) // Saturday start
    const weekEnd = endOfWeek(newDate, { weekStartsOn: 6 })
    setDateRange({ from: weekStart, to: weekEnd })
  }

  const handleNextPeriod = () => {
    // Move to next week (same logic as timesheets page)
    const newDate = new Date(dateRange.from)
    newDate.setDate(dateRange.from.getDate() + 7)
    const weekStart = startOfWeek(newDate, { weekStartsOn: 6 }) // Saturday start
    const weekEnd = endOfWeek(newDate, { weekStartsOn: 6 })
    setDateRange({ from: weekStart, to: weekEnd })
  }

  const FiltersCard = () => (
    <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none rounded-none border-l-0 border-r-0 border-t-0 m-0">
      <CardContent className="px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousPeriod}
                className="h-10 w-10 p-0 hover:bg-muted rounded-none border-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
                <div className="flex-1 text-center px-4 py-2 bg-background text-sm font-semibold text-gray-700 border-x border-border/50 flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPeriod}
                className="h-10 w-10 p-0 hover:bg-muted rounded-none border-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedWorkers.length === 0 ? (
                    "All Workers"
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge className="bg-muted-foreground text-xs">
                        {selectedWorkers.length} selected
                      </Badge>
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-workers"
                        checked={selectedWorkers.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWorkers([])
                          }
                        }}
                      />
                      <label htmlFor="all-workers" className="text-sm font-medium cursor-pointer">
                        All Workers
                      </label>
                    </div>
                    {reportsData.workers.map((worker) => (
                      <div key={worker.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={worker.id}
                          checked={selectedWorkers.includes(worker.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWorkers([...selectedWorkers, worker.id])
                            } else {
                              setSelectedWorkers(selectedWorkers.filter(id => id !== worker.id))
                            }
                          }}
                        />
                        <label htmlFor={worker.id} className="text-sm cursor-pointer">
                          {worker.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedProjects.length === 0 ? (
                    "All Projects"
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge className="bg-muted-foreground text-xs">
                        {selectedProjects.length} selected
                      </Badge>
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-projects"
                        checked={selectedProjects.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([])
                          }
                        }}
                      />
                      <label htmlFor="all-projects" className="text-sm font-medium cursor-pointer">
                        All Projects
                      </label>
                    </div>
                    {reportsData.projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={project.id}
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjects([...selectedProjects, project.id])
                            } else {
                              setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                            }
                          }}
                        />
                        <label htmlFor={project.id} className="text-sm cursor-pointer">
                          {project.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SummaryContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-BS", {
        style: "currency",
        currency: "BSD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    if (reportsData.loading) {
      return (
        <div className="space-y-6">
          {/* Combined metrics card skeleton */}
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardContent className="px-4 py-1">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-left flex-1 pl-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-300 mb-2"></div>
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-300"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hours by Project card skeleton */}
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardHeader>
              <div className="h-6 w-40 animate-pulse rounded bg-gray-300"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 animate-pulse rounded-full bg-gray-300"></div>
                        <div>
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-300 mb-1"></div>
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-300"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 w-12 animate-pulse rounded bg-gray-300 mb-1"></div>
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-300"></div>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full">
                      <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Payroll card skeleton */}
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-gray-300"></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 w-32 animate-pulse rounded bg-gray-300 mb-2"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-300"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-300 mb-2"></div>
                  <div className="h-6 w-24 animate-pulse rounded bg-gray-300"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (reportsData.error) {
      return (
        <div className="space-y-6">
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardContent className="p-6">
              <p className="text-red-600 text-sm">Error loading reports data: {reportsData.error}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      {/* Combined metrics card */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between">
            {/* Total Hours */}
            <div className="text-left flex-1 pl-2">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{reportsData.totalHours.toFixed(0)}</p>
            </div>

            {/* Separator */}
            <div className="border-l border-border/30 h-8 mx-3"></div>

            {/* Average Daily Hours */}
            <div className="text-left flex-1 pl-2">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-500">Avg Daily Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">
                {((reportsData.totalHours / Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))))).toFixed(1)}
              </p>
            </div>

            {/* Separator */}
            <div className="border-l border-border/30 h-8 mx-3"></div>

            {/* Total Labor Cost */}
            <div className="text-left flex-1 pl-2">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-500">Labor Cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{formatCurrency(reportsData.totalLaborCost)}</p>
            </div>

            {/* Separator */}
            <div className="border-l border-border/30 h-8 mx-3"></div>

            {/* Overtime Hours */}
            <div className="text-left flex-1 pl-2">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-500">Overtime Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{reportsData.overtimeHours.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours by Project (Top 3) */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Hours by Project (Top 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {reportsData.projectHours.length > 0 ? (
              <>
                {reportsData.projectHours.map((project, index) => {
                  const colors = [
                    { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
                    { bg: 'from-green-500 to-green-600', text: 'text-green-600' },
                    { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600' }
                  ]
                  const color = colors[index] || colors[0]
                  
                  return (
                    <div key={project.project_id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 bg-gradient-to-r ${color.bg} rounded-full shadow-sm`}></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900">{project.project_name}</span>
                            <div className="text-xs text-gray-500">
                              {index === 0 ? 'Primary project' : index === 1 ? 'Secondary project' : 'Supporting project'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{project.total_hours.toFixed(0)}h</div>
                          <div className="text-xs text-gray-500">{project.percentage.toFixed(0)}% of total</div>
                        </div>
                      </div>
            <div className="relative">
              <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
                <div
                  className={`bg-gradient-to-r ${color.bg} h-3 rounded-full shadow-sm transition-all duration-300`}
                  style={{ width: `${project.percentage}%` }}
                ></div>
              </div>
            </div>
                    </div>
                  )
                })}

                {/* Summary Stats */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Total Project Hours</span>
                    <span className="text-gray-900 font-bold">{reportsData.totalHours.toFixed(0)}h</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">No project data available for this period</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payroll Due Date */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Upcoming Payroll Due Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{reportsData.upcomingPayrollDate}</div>
              <p className="text-sm text-muted-foreground">Next pay period</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Estimated Amount</div>
              <div className="text-xl font-semibold">{formatCurrency(reportsData.upcomingPayrollAmount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    )
  }

  const DetailedContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-BS", {
        style: "currency",
        currency: "BSD",
        minimumFractionDigits: 2,
      }).format(amount)
    }

    if (reportsData.loading) {
      return (
        <div className="space-y-6">
          {/* Worker Hours Table skeleton */}
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 animate-pulse rounded bg-gray-300"></div>
                <div className="flex space-x-2">
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-300"></div>
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-300"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="w-full">
                  {/* Table header skeleton */}
                  <div className="grid grid-cols-7 gap-4 p-3 border-b">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="h-4 w-20 animate-pulse rounded bg-gray-300"></div>
                    ))}
                  </div>
                  {/* Table rows skeleton */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-7 gap-4 p-3 border-b">
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <div key={j} className="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Hours Table skeleton */}
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardHeader>
              <div className="h-6 w-40 animate-pulse rounded bg-gray-300"></div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="w-full">
                  {/* Table header skeleton */}
                  <div className="grid grid-cols-4 gap-4 p-3 border-b">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 w-20 animate-pulse rounded bg-gray-300"></div>
                    ))}
                  </div>
                  {/* Table rows skeleton */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-3 border-b">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (reportsData.error) {
      return (
        <div className="space-y-6">
          <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
            <CardContent className="p-6">
              <p className="text-red-600 text-sm">Error loading detailed data: {reportsData.error}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">

        {/* Worker Hours Table */}
        <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Worker Hours & Costs</CardTitle>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Export Excel
                </button>
                <button className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                  Export PDF
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Worker</th>
                    <th className="text-right p-3 font-medium">Regular Hours</th>
                    <th className="text-right p-3 font-medium">OT Hours</th>
                    <th className="text-right p-3 font-medium">Total Hours</th>
                    <th className="text-right p-3 font-medium">Regular Cost</th>
                    <th className="text-right p-3 font-medium">OT Cost</th>
                    <th className="text-right p-3 font-medium">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.workerHours.length > 0 ? (
                    reportsData.workerHours.map((worker) => (
                      <tr key={worker.worker_id} className="border-b">
                        <td className="p-3">{worker.worker_name}</td>
                        <td className="p-3 text-right">{worker.regular_hours.toFixed(1)}</td>
                        <td className="p-3 text-right text-orange-600">{worker.overtime_hours.toFixed(1)}</td>
                        <td className="p-3 text-right font-medium">{worker.total_hours.toFixed(1)}</td>
                        <td className="p-3 text-right">{formatCurrency(worker.regular_cost)}</td>
                        <td className="p-3 text-right text-orange-600">{formatCurrency(worker.overtime_cost)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(worker.total_cost)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No worker data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Project Hours Table */}
        <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
          <CardHeader>
            <CardTitle>Project Hours & Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Project</th>
                    <th className="text-right p-3 font-medium">Total Hours</th>
                    <th className="text-right p-3 font-medium">Total Cost</th>
                    <th className="text-right p-3 font-medium">Avg Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.projectCosts.length > 0 ? (
                    reportsData.projectCosts.map((project) => (
                      <tr key={project.project_id} className="border-b">
                        <td className="p-3">{project.project_name}</td>
                        <td className="p-3 text-right font-medium">{project.total_hours.toFixed(1)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(project.total_cost)}</td>
                        <td className="p-3 text-right">{formatCurrency(project.avg_hourly_rate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">
                        No project data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const WorkloadContent = () => (
    <div className="space-y-6">
      {/* Worker Workload by Hours */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Worker Workload by Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">John Smith</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">48.5h (Overloaded)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Sarah Wilson</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">52.0h (High)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Mike Johnson</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">40.0h (Optimal)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Tom Brown</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">28.0h (Underutilized)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects with Low/High Manpower */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Project Manpower Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium text-red-800">Paradise Resort Phase 1</div>
                <div className="text-sm text-red-600">High manpower - 12 workers</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-600">456h total</div>
                <div className="text-xs text-red-500">38h avg per worker</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium text-green-800">Cable Beach Condos</div>
                <div className="text-sm text-green-600">Optimal manpower - 6 workers</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600">342h total</div>
                <div className="text-xs text-green-500">57h avg per worker</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium text-yellow-800">Downtown Office Complex</div>
                <div className="text-sm text-yellow-600">Low manpower - 3 workers</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-yellow-600">234h total</div>
                <div className="text-xs text-yellow-500">78h avg per worker</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missed Clock-ins Flagged */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Missed Clock-ins Flagged</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-medium">John Smith</div>
                  <div className="text-sm text-orange-600">Missed 2 clock-ins this week</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-orange-600">Mon, Wed</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Sarah Wilson</div>
                  <div className="text-sm text-red-600">Missed 3 clock-ins this week</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-600">Tue, Thu, Fri</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ProfitabilityContent = () => (
    <div className="space-y-6">
      {/* Project Labor Cost vs Budget */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Project Labor Cost vs Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Green Project */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-green-800">Cable Beach Condos</div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">On Track</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Labor Cost: $10,260</span>
                  <span>Budget: $15,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-green-600">
                  <span>68% used</span>
                  <span>$4,740 remaining</span>
                </div>
              </div>
            </div>

            {/* Yellow Project */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-yellow-800">Downtown Office Complex</div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-700">At Risk</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Labor Cost: $7,020</span>
                  <span>Budget: $8,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-500 h-3 rounded-full" style={{ width: '88%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-yellow-600">
                  <span>88% used</span>
                  <span>$980 remaining</span>
                </div>
              </div>
            </div>

            {/* Red Project */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-red-800">Paradise Resort Phase 1</div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">Over Budget</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Labor Cost: $13,680</span>
                  <span>Budget: $12,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full" style={{ width: '114%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-red-600">
                  <span>114% used</span>
                  <span>-$1,680 over</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gross Margin Estimates */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Gross Margin Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">$4,740</div>
                <div className="text-sm text-green-700">Cable Beach Condos</div>
                <div className="text-xs text-green-600">32% margin</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">$980</div>
                <div className="text-sm text-yellow-700">Downtown Office</div>
                <div className="text-xs text-yellow-600">12% margin</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">-$1,680</div>
                <div className="text-sm text-red-700">Paradise Resort</div>
                <div className="text-xs text-red-600">-14% margin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Health Indicators */}
      <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none">
        <CardHeader>
          <CardTitle>Project Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-green-800">Cable Beach Condos</div>
                  <div className="text-sm text-green-600">Healthy - Under budget</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-700">32% margin</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-yellow-800">Downtown Office Complex</div>
                  <div className="text-sm text-yellow-600">At risk - Near budget limit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-yellow-700">12% margin</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-red-800">Paradise Resort Phase 1</div>
                  <div className="text-sm text-red-600">Critical - Over budget</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-red-700">-14% margin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div>
      {/* Full-width Filters Card - Stretches from sidebar to right edge, touching site header */}
      <div className="w-full -mx-6 -mt-6" style={{ width: 'calc(100% + 3rem)' }}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <FiltersCard />
        </div>
      </div>
      
      {/* Content with proper padding */}
      <div className="container mx-auto space-y-2 pt-6 pb-6 px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="summary" className="space-y-6">
              <SummaryContent />
            </TabsContent>
            <TabsContent value="detailed" className="space-y-6">
              <DetailedContent />
            </TabsContent>
            <TabsContent value="workload" className="space-y-6">
              <WorkloadContent />
            </TabsContent>
            <TabsContent value="profitability" className="space-y-6">
              <ProfitabilityContent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
