"use client"

import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, CalendarDays, Download, TrendingUp, Clock, DollarSign, AlertCircle, BarChart3, Users, FolderOpen } from "lucide-react"
import { useReportsTabs } from "@/context/reports-tabs-context"
import { useReportsData } from "@/lib/hooks/use-reports-data"
import { useDateRange } from "@/context/date-range-context"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { useState } from "react"

// TropiTrack primary color
const TROPI_BLUE = '#2596be'

// Animation keyframes for smooth transitions
const animationStyles = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

export default function ReportsPageClient() {
  const { theme } = useTheme()
  const { activeTab } = useReportsTabs()
  const reportsData = useReportsData()
  const { dateRange, setDateRange } = useDateRange()
  
  // State for multiselect filters
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handlePreviousPeriod = () => {
    if (!dateRange?.from) return
    // Move to previous week (same logic as timesheets page)
    const newDate = new Date(dateRange.from)
    newDate.setDate(dateRange.from.getDate() - 7)
    const weekStart = startOfWeek(newDate, { weekStartsOn: 6 }) // Saturday start
    const weekEnd = endOfWeek(newDate, { weekStartsOn: 6 })
    setDateRange({ from: weekStart, to: weekEnd })
  }

  const handleNextPeriod = () => {
    if (!dateRange?.from) return
    // Move to next week (same logic as timesheets page)
    const newDate = new Date(dateRange.from)
    newDate.setDate(dateRange.from.getDate() + 7)
    const weekStart = startOfWeek(newDate, { weekStartsOn: 6 }) // Saturday start
    const weekEnd = endOfWeek(newDate, { weekStartsOn: 6 })
    setDateRange({ from: weekStart, to: weekEnd })
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return
    const weekStart = startOfWeek(date, { weekStartsOn: 6 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 6 })
    setDateRange({ from: weekStart, to: weekEnd })
    setCalendarOpen(false)
  }

  const FiltersCard = () => (
    <div 
      className="backdrop-blur-sm shadow-none rounded-none border-l-0 border-r-0 border-t-0 m-0 transition-all duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#171717' : 'oklch(1 0.003 250)',
        borderBottom: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.5)'
      }}
    >
      <div className="px-4 lg:px-6 pt-5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <div>
            <div 
              className="flex items-center rounded-xl overflow-hidden shadow-sm"
              style={{
                backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousPeriod}
                className="h-10 w-10 p-0 rounded-none border-0 hover:bg-primary/10 transition-colors"
                style={{
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex-1 text-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer transition-all hover:bg-primary/5"
                    style={{
                      backgroundColor: 'transparent',
                      color: theme === 'dark' ? '#F3F4F6' : '#374151',
                      border: 'none',
                      outline: 'none'
                    }}
                  >
                    <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {dateRange?.from && dateRange?.to && (
                        <>
                          <span className="hidden sm:inline">{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}</span>
                          <span className="sm:hidden">{format(dateRange.from, 'M/d')} - {format(dateRange.to, 'M/d/yy')}</span>
                        </>
                      )}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={handleCalendarSelect}
                    defaultMonth={dateRange?.from}
                    weekStartsOn={6}
                    modifiers={{
                      selected: dateRange?.from && dateRange?.to 
                        ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
                        : []
                    }}
                    modifiersClassNames={{
                      selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPeriod}
                className="h-10 w-10 p-0 rounded-none border-0 hover:bg-primary/10 transition-colors"
                style={{
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Workers Filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="justify-start text-left font-semibold text-base hover:bg-transparent"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#1f2937' }}
                >
                  <div className={`rounded p-1 mr-2 flex-shrink-0 ${
                    selectedWorkers.length > 0
                      ? "bg-primary" 
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}>
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="whitespace-nowrap">
                    Workers {selectedWorkers.length > 0 ? `(${selectedWorkers.length})` : ''}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-lg shadow-lg" align="start">
                <div className="p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="all-workers"
                        checked={selectedWorkers.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWorkers([])
                          }
                        }}
                        className="transition-all duration-200"
                      />
                      <label htmlFor="all-workers" className="text-sm font-semibold cursor-pointer">
                        All Workers
                      </label>
                    </div>
                    {reportsData.workers.map((worker) => (
                      <div key={worker.id} className="flex items-center space-x-2 transition-all duration-200 hover:bg-muted/50 rounded p-1">
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
                          className="transition-all duration-200"
                        />
                        <label htmlFor={worker.id} className="text-sm cursor-pointer flex-1">
                          {worker.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Projects Filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="justify-start text-left font-semibold text-base hover:bg-transparent"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#1f2937' }}
                >
                  <div className={`rounded p-1 mr-2 flex-shrink-0 ${
                    selectedProjects.length > 0
                      ? "bg-primary" 
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}>
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="whitespace-nowrap">
                    Projects {selectedProjects.length > 0 ? `(${selectedProjects.length})` : ''}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-lg shadow-lg" align="start">
                <div className="p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="all-projects"
                        checked={selectedProjects.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([])
                          }
                        }}
                        className="transition-all duration-200"
                      />
                      <label htmlFor="all-projects" className="text-sm font-semibold cursor-pointer">
                        All Projects
                      </label>
                    </div>
                    {reportsData.projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2 transition-all duration-200 hover:bg-muted/50 rounded p-1">
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
                          className="transition-all duration-200"
                        />
                        <label htmlFor={project.id} className="text-sm cursor-pointer flex-1">
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
      </div>
    </div>
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
        <div className="space-y-5 animate-in fade-in duration-500">
          <style>{animationStyles}</style>
          {/* Combined metrics card skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'slideUp 0.6s ease-out' }}>
            {[1, 2, 3, 4].map((i) => (
              <Card 
                key={i}
                className="shadow-none rounded-xl overflow-hidden"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
                  animation: `scaleIn 0.5s ease-out ${i * 0.1}s both`
                }}
              >
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div 
                      className="h-4 w-24 rounded-lg"
                      style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                          : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite'
                      }}
                    ></div>
                    <div 
                      className="h-8 w-20 rounded-lg"
                      style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                          : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite 0.2s'
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hours by Project card skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ animation: 'slideUp 0.7s ease-out 0.2s both' }}>
            <div className="lg:col-span-2">
              <Card 
                className="shadow-none rounded-xl overflow-hidden h-full"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
                }}
              >
                <CardHeader className="pb-4">
                  <div 
                    className="h-6 w-48 rounded-lg"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                        : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  ></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-10 h-10 rounded-lg"
                              style={{
                                background: theme === 'dark' 
                                  ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                                  : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                                backgroundSize: '1000px 100%',
                                animation: `shimmer 2s infinite ${i * 0.2}s`
                              }}
                            ></div>
                            <div className="flex-1">
                              <div 
                                className="h-4 w-32 rounded mb-2"
                                style={{
                                  background: theme === 'dark' 
                                    ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                                    : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                                  backgroundSize: '1000px 100%',
                                  animation: `shimmer 2s infinite ${i * 0.2}s`
                                }}
                              ></div>
                              <div 
                                className="h-3 w-24 rounded"
                                style={{
                                  background: theme === 'dark' 
                                    ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                                    : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                                  backgroundSize: '1000px 100%',
                                  animation: `shimmer 2s infinite ${i * 0.2 + 0.1}s`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div 
                              className="h-6 w-16 rounded mb-2"
                              style={{
                                background: theme === 'dark' 
                                  ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                                  : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                                backgroundSize: '1000px 100%',
                                animation: `shimmer 2s infinite ${i * 0.2}s`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${40 + i * 20}%`,
                              background: theme === 'dark' 
                                ? 'linear-gradient(90deg, #333333 0%, #404040 50%, #333333 100%)'
                                : 'linear-gradient(90deg, #d1d5db 0%, #e5e7eb 50%, #d1d5db 100%)',
                              backgroundSize: '1000px 100%',
                              animation: `shimmer 2s infinite ${i * 0.2}s`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Donut Chart Skeleton */}
            <div className="lg:col-span-1">
              <Card 
                className="shadow-none rounded-xl overflow-hidden h-full"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
                }}
              >
                <CardHeader className="pb-4">
                  <div 
                    className="h-5 w-32 rounded-lg"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                        : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  ></div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div 
                      className="w-48 h-48 rounded-full"
                      style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                          : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite'
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming Payroll card skeleton */}
          <Card 
            className="shadow-none rounded-xl overflow-hidden"
            style={{
              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
              border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            <CardHeader className="pb-4">
              <div 
                className="h-6 w-56 rounded-lg"
                style={{
                  background: theme === 'dark' 
                    ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                    : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite'
                }}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                        : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  ></div>
                  <div>
                    <div 
                      className="h-8 w-32 rounded-lg mb-2"
                      style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                          : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite 0.2s'
                      }}
                    ></div>
                    <div 
                      className="h-4 w-28 rounded"
                      style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                          : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                        backgroundSize: '1000px 100%',
                        animation: 'shimmer 2s infinite 0.3s'
                      }}
                    ></div>
                  </div>
                </div>
                <div 
                  className="p-5 rounded-xl w-full sm:w-auto"
                  style={{ backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb' }}
                >
                  <div 
                    className="h-4 w-24 rounded mb-2"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                        : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite 0.4s'
                    }}
                  ></div>
                  <div 
                    className="h-7 w-28 rounded-lg"
                    style={{
                      background: theme === 'dark' 
                        ? 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
                        : 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
                      backgroundSize: '1000px 100%',
                      animation: 'shimmer 2s infinite 0.5s'
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (reportsData.error) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card 
            className="shadow-none rounded-xl"
            style={{
              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
              border: '1px solid rgb(239 68 68)'
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Error loading reports data: {reportsData.error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
    <div className="space-y-5">
      <style>{animationStyles}</style>
      {/* Combined metrics cards - Grid layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'slideUp 0.6s ease-out' }}>
        {/* Total Hours */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden relative"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'scaleIn 0.5s ease-out 0s both'
          }}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at top right, ${TROPI_BLUE}10 0%, transparent 70%)`
            }}
          ></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.2)' : 'rgba(37, 150, 190, 0.15)',
                  boxShadow: `0 4px 12px ${TROPI_BLUE}20`
                }}
              >
                <Clock className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" style={{ color: TROPI_BLUE }} />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <p 
              className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            >
              Total Hours
            </p>
            <p 
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              {reportsData.totalHours.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        {/* Average Daily Hours */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden relative"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'scaleIn 0.5s ease-out 0.1s both'
          }}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at top right, #10b98110 0%, transparent 70%)`
            }}
          ></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
              >
                <TrendingUp className="h-5 w-5 text-green-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <Clock className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <p 
              className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            >
              Avg Daily Hours
            </p>
            <p 
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              {dateRange?.from && dateRange?.to 
                ? ((reportsData.totalHours / Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))))).toFixed(1)
                : '0.0'}
            </p>
          </CardContent>
        </Card>

        {/* Total Labor Cost */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden relative"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'scaleIn 0.5s ease-out 0.2s both'
          }}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at top right, #8b5cf610 0%, transparent 70%)`
            }}
          ></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                }}
              >
                <DollarSign className="h-5 w-5 text-purple-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <TrendingUp className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <p 
              className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            >
              Labor Cost
            </p>
            <p 
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              {formatCurrency(reportsData.totalLaborCost)}
            </p>
          </CardContent>
        </Card>

        {/* Overtime Hours */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden relative"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'scaleIn 0.5s ease-out 0.3s both'
          }}
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at top right, #f59e0b10 0%, transparent 70%)`
            }}
          ></div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}
              >
                <AlertCircle className="h-5 w-5 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <Clock className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>
            <p 
              className="text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            >
              Overtime Hours
            </p>
            <p 
              className="text-3xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              {reportsData.overtimeHours.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hours by Project (Top 3) with Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ animation: 'slideUp 0.7s ease-out 0.3s both' }}>
        {/* Main Project Breakdown */}
        <div className="lg:col-span-2">
          <Card 
            className="shadow-none rounded-xl transition-all duration-300 h-full group"
            style={{
              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
              border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
            }}
          >
            <CardHeader className="pb-4">
              <CardTitle 
                className="text-xl font-bold flex items-center gap-3 transition-colors duration-300"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >
                <div 
                  className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                  style={{ 
                    backgroundColor: `${TROPI_BLUE}15`,
                    boxShadow: `0 4px 12px ${TROPI_BLUE}15`
                  }}
                >
                  <BarChart3 className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" style={{ color: TROPI_BLUE }} />
                </div>
                <span className="transition-transform duration-300 group-hover:translate-x-1">Hours by Project (Top 3)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {reportsData.projectHours.length > 0 ? (
                  <>
                    {reportsData.projectHours.map((project, index) => {
                      const colors = [
                        { solid: TROPI_BLUE, light: 'rgba(37, 150, 190, 0.1)', badge: TROPI_BLUE },
                        { solid: '#10b981', light: 'rgba(16, 185, 129, 0.1)', badge: '#10b981' },
                        { solid: '#8b5cf6', light: 'rgba(139, 92, 246, 0.1)', badge: '#8b5cf6' }
                      ]
                      const color = colors[index] || colors[0]
                      const labels = ['Primary', 'Secondary', 'Supporting']
                      
                      return (
                        <div 
                          key={project.project_id} 
                          className="space-y-3 p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer group/project"
                          style={{
                            backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb',
                            border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#e5e7eb'}`,
                            animation: `scaleIn 0.5s ease-out ${0.5 + index * 0.1}s both`
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div 
                                className="p-2.5 rounded-xl shadow-sm flex-shrink-0 transition-all duration-300 group-hover/project:scale-110 group-hover/project:rotate-3"
                                style={{ 
                                  backgroundColor: color.light,
                                  boxShadow: `0 4px 10px ${color.solid}20`
                                }}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full transition-all duration-300 group-hover/project:scale-110"
                                  style={{ 
                                    backgroundColor: color.solid,
                                    boxShadow: `0 0 8px ${color.solid}40`
                                  }}
                                ></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className="text-sm font-semibold truncate"
                                    style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                                  >
                                    {project.project_name}
                                  </span>
                                  <Badge 
                                    className="text-xs px-2 py-0.5 flex-shrink-0"
                                    style={{ 
                                      backgroundColor: color.light,
                                      color: color.solid,
                                      border: `1px solid ${color.solid}40`
                                    }}
                                  >
                                    {labels[index]}
                                  </Badge>
                                </div>
                                <div 
                                  className="text-xs"
                                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                                >
                                  {project.percentage.toFixed(1)}% of total hours
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div 
                                className="text-2xl font-bold"
                                style={{ color: color.solid }}
                              >
                                {project.total_hours.toFixed(0)}
                              </div>
                              <div 
                                className="text-xs font-medium"
                                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                              >
                                hours
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Progress Bar */}
                          <div className="relative pt-1">
                            <div 
                              className="w-full rounded-full h-2.5 overflow-hidden"
                              style={{ 
                                backgroundColor: theme === 'dark' ? '#262626' : '#e5e7eb'
                              }}
                            >
                              <div
                                className="h-2.5 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${project.percentage}%`,
                                  background: `linear-gradient(90deg, ${color.solid} 0%, ${color.solid}dd 100%)`,
                                  boxShadow: `0 0 10px ${color.solid}40`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Summary Stats */}
                    <div 
                      className="pt-4 mt-2"
                      style={{ 
                        borderTop: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid rgb(226 232 240)' 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563' }}
                        >
                          Total Project Hours
                        </span>
                        <span 
                          className="font-bold text-lg"
                          style={{ color: TROPI_BLUE }}
                        >
                          {reportsData.totalHours.toFixed(0)}h
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div 
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }}
                    >
                      <AlertCircle 
                        className="h-8 w-8"
                        style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                      />
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                    >
                      No project data available for this period
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simple Donut Chart Visualization */}
        <div className="lg:col-span-1">
          <Card 
            className="shadow-none rounded-xl transition-all duration-300 h-full group"
            style={{
              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
              border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
            }}
          >
            <CardHeader className="pb-4">
              <CardTitle 
                className="text-lg font-bold flex items-center gap-2 transition-colors duration-300"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >
                <div 
                  className="p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ 
                    backgroundColor: `${TROPI_BLUE}10`,
                    boxShadow: `0 4px 12px ${TROPI_BLUE}10`
                  }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: TROPI_BLUE }} />
                </div>
                <span className="transition-transform duration-300 group-hover:translate-x-1">Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsData.projectHours.length > 0 ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Simple CSS Donut Chart */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={theme === 'dark' ? '#262626' : '#f3f4f6'}
                        strokeWidth="40"
                      />
                      {reportsData.projectHours.map((project, index) => {
                        const colors = [TROPI_BLUE, '#10b981', '#8b5cf6']
                        const circumference = 2 * Math.PI * 80
                        const previousPercentages = reportsData.projectHours
                          .slice(0, index)
                          .reduce((sum, p) => sum + p.percentage, 0)
                        const offset = circumference - (previousPercentages / 100) * circumference
                        const dashArray = `${(project.percentage / 100) * circumference} ${circumference}`
                        
                        return (
                          <circle
                            key={project.project_id}
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke={colors[index] || colors[0]}
                            strokeWidth="40"
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                            className="transition-all duration-700"
                            style={{
                              filter: `drop-shadow(0 0 8px ${colors[index]}40)`
                            }}
                          />
                        )
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div 
                          className="text-3xl font-bold"
                          style={{ color: TROPI_BLUE }}
                        >
                          {reportsData.totalHours.toFixed(0)}
                        </div>
                        <div 
                          className="text-xs font-medium"
                          style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                        >
                          Total Hours
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-2">
                    {reportsData.projectHours.map((project, index) => {
                      const colors = [TROPI_BLUE, '#10b981', '#8b5cf6']
                      return (
                        <div 
                          key={project.project_id}
                          className="flex items-center justify-between p-2 rounded-lg transition-colors duration-200"
                          style={{
                            backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colors[index] }}
                            ></div>
                            <span 
                              className="text-xs truncate"
                              style={{ color: theme === 'dark' ? '#e5e7eb' : '#374151' }}
                            >
                              {project.project_name.length > 15 
                                ? `${project.project_name.substring(0, 15)}...` 
                                : project.project_name}
                            </span>
                          </div>
                          <span 
                            className="text-xs font-semibold flex-shrink-0"
                            style={{ color: colors[index] }}
                          >
                            {project.percentage.toFixed(0)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full py-8">
                  <div 
                    className="text-sm text-center"
                    style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                  >
                    No data to display
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Payroll Due Date - Enhanced */}
      <Card 
        className="shadow-none rounded-xl transition-all duration-300 group overflow-hidden relative"
        style={{
          backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
          border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
          animation: 'slideUp 0.8s ease-out 0.5s both'
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${TROPI_BLUE}05 0%, transparent 60%)`
          }}
        ></div>
        <CardHeader className="pb-4 relative z-10">
          <CardTitle 
            className="text-xl font-bold transition-colors duration-300"
            style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
          >
            Upcoming Payroll Due Date
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.2)' : 'rgba(37, 150, 190, 0.15)',
                  boxShadow: `0 4px 12px ${TROPI_BLUE}20`
                }}
              >
                <Clock 
                  className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: TROPI_BLUE }}
                />
              </div>
              <div>
                <div 
                  className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:scale-105"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                >
                  {reportsData.upcomingPayrollDate}
                </div>
                <p 
                  className="text-sm font-semibold transition-colors duration-300"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Next pay period
                </p>
              </div>
            </div>
            
            <div 
              className="text-left sm:text-right p-5 rounded-xl w-full sm:w-auto transition-all duration-300 group-hover:shadow-md"
              style={{
                backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb',
                border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#e5e7eb'}`
              }}
            >
              <div 
                className="text-sm font-bold mb-2 flex items-center gap-2 justify-start sm:justify-end transition-colors duration-300"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <DollarSign className="h-4 w-4" style={{ color: TROPI_BLUE }} />
                Estimated Amount
              </div>
              <div 
                className="text-2xl font-bold transition-all duration-300 group-hover:scale-105"
                style={{ color: TROPI_BLUE }}
              >
                {formatCurrency(reportsData.upcomingPayrollAmount)}
              </div>
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
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Worker Hours Table skeleton */}
          <Card 
            className="backdrop-blur-sm shadow-md rounded-xl transition-all duration-300"
            style={{
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid rgb(226 232 240)'
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-56 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex space-x-2">
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="w-full">
                  {/* Table rows skeleton */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e5e7eb' }}>
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-700 ml-auto"></div>
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Hours Table skeleton */}
          <Card 
            className="backdrop-blur-sm shadow-md rounded-xl transition-all duration-300"
            style={{
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid rgb(226 232 240)'
            }}
          >
            <CardHeader className="pb-4">
              <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e5e7eb' }}>
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700 ml-auto"></div>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
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
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card 
            className="shadow-none rounded-xl"
            style={{
              backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
              border: '1px solid rgb(239 68 68)'
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Error loading detailed data: {reportsData.error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <style>{animationStyles}</style>

        {/* Worker Hours Table - Enhanced */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 group"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'slideUp 0.6s ease-out'
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle 
                className="text-xl font-bold flex items-center gap-3 transition-colors duration-300"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >
                <div 
                  className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                  style={{ 
                    backgroundColor: `${TROPI_BLUE}15`,
                    boxShadow: `0 4px 12px ${TROPI_BLUE}20`
                  }}
                >
                  <Users className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" style={{ color: TROPI_BLUE }} />
                </div>
                <span className="transition-transform duration-300 group-hover:translate-x-1">Worker Hours & Costs</span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <button 
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 flex items-center gap-2"
                  style={{ 
                    backgroundColor: TROPI_BLUE,
                    boxShadow: `0 4px 12px ${TROPI_BLUE}30`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e7a9a'
                    e.currentTarget.style.boxShadow = `0 6px 16px ${TROPI_BLUE}40`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = TROPI_BLUE
                    e.currentTarget.style.boxShadow = `0 4px 12px ${TROPI_BLUE}30`
                  }}
                >
                  <Download className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  Export Excel
                </button>
                <button 
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 flex items-center gap-2"
                  style={{ 
                    backgroundColor: '#ef4444',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <Download className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  Export PDF
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr 
                    className="text-left"
                    style={{ 
                      borderBottom: theme === 'dark' ? '2px solid #2a2a2a' : '2px solid rgb(226 232 240)',
                      backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb'
                    }}
                  >
                    <th 
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Worker</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Regular Hrs</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >OT Hrs</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Total Hrs</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Regular Cost</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >OT Cost</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.workerHours.length > 0 ? (
                    reportsData.workerHours.map((worker, index) => (
                      <tr 
                        key={worker.worker_id}
                        className="transition-all duration-300 group/row"
                        style={{ 
                          borderBottom: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid rgb(243 244 246)',
                          backgroundColor: index % 2 === 0 
                            ? 'transparent' 
                            : (theme === 'dark' ? '#151515' : '#f9fafb'),
                          animation: `scaleIn 0.4s ease-out ${0.7 + index * 0.05}s both`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f1f1f' : '#f3f4f6'
                          e.currentTarget.style.transform = 'scale(1.005)'
                          e.currentTarget.style.boxShadow = theme === 'dark' 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 
                            ? 'transparent' 
                            : (theme === 'dark' ? '#151515' : '#f9fafb')
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <td 
                          className="p-4 font-medium"
                          style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full transition-all duration-300 group-hover/row:scale-150 group-hover/row:shadow-lg"
                              style={{ 
                                backgroundColor: TROPI_BLUE,
                                boxShadow: `0 0 8px ${TROPI_BLUE}40`
                              }}
                            ></div>
                            <span className="transition-all duration-300 group-hover/row:translate-x-1">
                              {worker.worker_name}
                            </span>
                          </div>
                        </td>
                        <td 
                          className="p-4 text-right font-mono"
                          style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                        >{worker.regular_hours.toFixed(1)}</td>
                        <td className="p-4 text-right font-mono font-medium text-amber-600 dark:text-amber-500">
                          {worker.overtime_hours.toFixed(1)}
                        </td>
                        <td 
                          className="p-4 text-right font-semibold font-mono"
                          style={{ color: TROPI_BLUE }}
                        >{worker.total_hours.toFixed(1)}</td>
                        <td 
                          className="p-4 text-right font-mono text-sm"
                          style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                        >{formatCurrency(worker.regular_cost)}</td>
                        <td className="p-4 text-right font-mono text-sm font-medium text-amber-600 dark:text-amber-500">
                          {formatCurrency(worker.overtime_cost)}
                        </td>
                        <td 
                          className="p-4 text-right font-bold font-mono"
                          style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                        >{formatCurrency(worker.total_cost)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td 
                        colSpan={7} 
                        className="p-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }}
                          >
                            <AlertCircle 
                              className="h-8 w-8"
                              style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                            />
                          </div>
                          <div 
                            className="text-sm font-medium"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          >
                            No worker data available for this period
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Project Hours Table - Enhanced */}
        <Card 
          className="shadow-none rounded-xl transition-all duration-300 group"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)',
            animation: 'slideUp 0.7s ease-out 0.2s both'
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle 
              className="text-xl font-bold flex items-center gap-3 transition-colors duration-300"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              <div 
                className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                style={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                }}
              >
                <BarChart3 className="h-5 w-5 text-purple-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="transition-transform duration-300 group-hover:translate-x-1">Project Hours & Costs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr 
                    className="text-left"
                    style={{ 
                      borderBottom: theme === 'dark' ? '2px solid #2a2a2a' : '2px solid rgb(226 232 240)',
                      backgroundColor: theme === 'dark' ? '#151515' : '#f9fafb'
                    }}
                  >
                    <th 
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Project</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Total Hours</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Total Cost</th>
                    <th 
                      className="text-right p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Avg Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.projectCosts.length > 0 ? (
                    reportsData.projectCosts.map((project, index) => {
                      const colors = [TROPI_BLUE, '#10b981', '#8b5cf6']
                      const projectColor = colors[index % colors.length]
                      
                      return (
                        <tr 
                          key={project.project_id}
                          className="transition-all duration-300 group/row"
                          style={{ 
                            borderBottom: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid rgb(243 244 246)',
                            backgroundColor: index % 2 === 0 
                              ? 'transparent' 
                              : (theme === 'dark' ? '#151515' : '#f9fafb'),
                            animation: `scaleIn 0.4s ease-out ${1 + index * 0.05}s both`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f1f1f' : '#f3f4f6'
                            e.currentTarget.style.transform = 'scale(1.005)'
                            e.currentTarget.style.boxShadow = theme === 'dark' 
                              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = index % 2 === 0 
                              ? 'transparent' 
                              : (theme === 'dark' ? '#151515' : '#f9fafb')
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <td 
                            className="p-4 font-medium"
                            style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300 group-hover/row:scale-150 group-hover/row:shadow-lg"
                                style={{ 
                                  backgroundColor: projectColor,
                                  boxShadow: `0 0 8px ${projectColor}40`
                                }}
                              ></div>
                              <span className="transition-all duration-300 group-hover/row:translate-x-1">
                                {project.project_name}
                              </span>
                            </div>
                          </td>
                          <td 
                            className="p-4 text-right font-semibold font-mono"
                            style={{ color: projectColor }}
                          >{project.total_hours.toFixed(1)}</td>
                          <td 
                            className="p-4 text-right font-bold font-mono"
                            style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                          >{formatCurrency(project.total_cost)}</td>
                          <td 
                            className="p-4 text-right font-mono text-sm"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >{formatCurrency(project.avg_hourly_rate)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td 
                        colSpan={4} 
                        className="p-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme === 'dark' ? '#262626' : '#f3f4f6' }}
                          >
                            <AlertCircle 
                              className="h-8 w-8"
                              style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                            />
                          </div>
                          <div 
                            className="text-sm font-medium"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          >
                            No project data available for this period
                          </div>
                        </div>
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
    <div className="space-y-5">
      <style>{animationStyles}</style>
      <div className="flex items-center justify-center min-h-[60vh]" style={{ animation: 'scaleIn 0.6s ease-out' }}>
        <Card 
          className="shadow-none rounded-xl max-w-2xl w-full"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
          }}
        >
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div 
                className="p-6 rounded-2xl"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.15)' : 'rgba(37, 150, 190, 0.1)',
                  boxShadow: `0 8px 24px ${TROPI_BLUE}15`
                }}
              >
                <Users 
                  className="h-16 w-16" 
                  style={{ color: TROPI_BLUE }}
                />
              </div>
              
              {/* Text Content */}
              <div className="space-y-3">
                <h3 
                  className="text-2xl font-bold"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                >
                  Workload Analysis
                </h3>
                <p 
                  className="text-base leading-relaxed max-w-md"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Detailed workload distribution and capacity analysis coming soon. 
                  Track worker utilization, identify overload risks, and optimize resource allocation.
                </p>
                <Badge 
                  className="text-xs font-semibold px-3 py-1.5 mt-2"
                  style={{ 
                    backgroundColor: `${TROPI_BLUE}20`,
                    color: TROPI_BLUE,
                    border: `1px solid ${TROPI_BLUE}40`
                  }}
                >
                  Coming Soon
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const ProfitabilityContent = () => (
    <div className="space-y-5">
      <style>{animationStyles}</style>
      <div className="flex items-center justify-center min-h-[60vh]" style={{ animation: 'scaleIn 0.6s ease-out' }}>
        <Card 
          className="shadow-none rounded-xl max-w-2xl w-full"
          style={{
            backgroundColor: theme === 'dark' ? '#1f1f1f' : 'oklch(1 0.003 250)',
            border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
          }}
        >
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div 
                className="p-6 rounded-2xl"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)'
                }}
              >
                <TrendingUp 
                  className="h-16 w-16 text-purple-500" 
                />
              </div>
              
              {/* Text Content */}
              <div className="space-y-3">
                <h3 
                  className="text-2xl font-bold"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                >
                  Profitability Insights
                </h3>
                <p 
                  className="text-base leading-relaxed max-w-md"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Advanced profitability analytics with budget tracking, margin analysis, and project health indicators. 
                  Get actionable insights to improve your bottom line.
                </p>
                <Badge 
                  className="text-xs font-semibold px-3 py-1.5 mt-2"
                  style={{ 
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  In Development
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
      <div 
        className="w-full pt-6 pb-6"
        style={{
          backgroundColor: theme === 'dark' ? '#0E141A' : 'rgb(240 243 246 / 0.95)',
          minHeight: 'calc(100vh - 8rem)',
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          marginBottom: '-1.5rem',
          width: 'calc(100% + 3rem)'
        }}
      >
        <div className="space-y-2 px-6">
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
    </div>
  )
}
