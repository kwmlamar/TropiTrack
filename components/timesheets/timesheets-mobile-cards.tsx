"use client"

import { format, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import type { TimesheetWithDetails } from "@/lib/types"
import type { Worker } from "@/lib/types/worker"
import { ProjectListDialog } from "./project-list-dialog"

interface TimesheetsMobileCardsProps {
  workerEntries: Array<[string, TimesheetWithDetails[]]>
  allWorkers: Worker[]
  weekDays: Date[]
  viewMode: "daily" | "weekly"
  onUpdateTimesheet: (id: string, field: string, value: number) => Promise<void>
  onCellClick: (day: Date, workerId: string) => void
  onDisabledInputClick: (timesheet: TimesheetWithDetails) => void
}

export function TimesheetsMobileCards({
  workerEntries,
  allWorkers,
  weekDays,
  viewMode,
  onUpdateTimesheet,
  onCellClick,
  onDisabledInputClick
}: TimesheetsMobileCardsProps) {
  const { theme } = useTheme()

  if (workerEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-muted-foreground text-center">No timesheet entries found for this period</p>
      </div>
    )
  }

  return (
    <div className="md:hidden space-y-3 px-3 py-4 overflow-y-auto">
      {workerEntries.map(([workerId, timesheetsInWeek]) => {
        const worker = allWorkers.find(w => w.id === workerId)
        const isInactive = worker && !worker.is_active
        const weekTotalHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.total_hours, 0)
        const weekOvertimeHours = timesheetsInWeek.reduce((sum, ts) => sum + ts.overtime_hours, 0)

        return (
          <Card 
            key={workerId}
            className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200"
            style={{
              opacity: isInactive ? 0.7 : 1,
              backgroundColor: theme === 'dark' ? '#0E141A' : '#ffffff',
              boxShadow: theme === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <CardContent className="p-5">
              {/* Worker Header */}
              <div className="flex items-start justify-between mb-4 pb-4" style={{
                borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
              }}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate mb-1" style={{
                    color: theme === 'dark' ? '#F3F4F6' : '#111827'
                  }}>
                    {worker?.name || "Unknown Worker"}
                  </h3>
                  <p className="text-sm font-medium" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    {worker?.position || "Worker"}
                  </p>
                </div>
                {isInactive && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 shrink-0"
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.1)' : 'rgba(37, 150, 190, 0.1)',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      borderColor: theme === 'dark' ? '#374151' : '#D1D5DB'
                    }}
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Projects */}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Projects</div>
                <ProjectListDialog
                  projects={Array.from(
                    new Set(
                      timesheetsInWeek.map((ts) => ts.project?.name || "Unknown Project")
                    )
                  )}
                  workerName={worker?.name || "Unknown Worker"}
                />
              </div>

              {/* Week Summary */}
              {viewMode === "weekly" && (
                <div className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl" style={{
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(37, 150, 190, 0.08)' 
                    : 'rgba(37, 150, 190, 0.05)'
                }}>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }}>Total Hours</div>
                    <div className="text-2xl font-extrabold" style={{
                      color: theme === 'dark' ? '#F3F4F6' : '#111827'
                    }}>
                      {weekTotalHours}h
                    </div>
                  </div>
                  {weekOvertimeHours > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                      }}>Overtime</div>
                      <div className="text-2xl font-extrabold" style={{
                        color: '#ea580c'
                      }}>
                        +{weekOvertimeHours}h
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Hours Grid */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Daily Hours</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {weekDays.map((day) => {
                    const dayTimesheet = timesheetsInWeek.find(
                      (ts) => format(parseISO(ts.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                    )
                    const isApproved = dayTimesheet?.supervisor_approval === "approved"

                    return (
                      <div
                        key={day.toISOString()}
                        className="rounded-xl p-3 border-0 shadow-sm transition-shadow hover:shadow-md"
                        style={{
                          backgroundColor: isApproved 
                            ? (theme === 'dark' 
                              ? 'rgba(37, 150, 190, 0.1)' 
                              : 'rgba(37, 150, 190, 0.08)')
                            : (theme === 'dark' ? '#1A2332' : '#F9FAFB'),
                          boxShadow: theme === 'dark' 
                            ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' 
                            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="text-xs font-semibold mb-2" style={{
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }}>
                          {format(day, "EEE, MMM d")}
                        </div>
                        
                        {dayTimesheet ? (
                          isApproved ? (
                            <div
                              onClick={() => onDisabledInputClick(dayTimesheet)}
                              className="cursor-pointer p-2 rounded-lg hover:opacity-80 transition-opacity"
                            >
                              <div className="text-2xl font-extrabold mb-1" style={{
                                color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF'
                              }}>
                                {dayTimesheet.total_hours}h
                              </div>
                              {dayTimesheet.overtime_hours > 0 && (
                                <div 
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
                                  style={{
                                    color: '#ea580c',
                                    backgroundColor: theme === 'dark' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(234, 88, 12, 0.1)'
                                  }}
                                >
                                  +{dayTimesheet.overtime_hours}h OT
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                value={dayTimesheet.total_hours}
                                onChange={(e) =>
                                  onUpdateTimesheet(
                                    dayTimesheet.id,
                                    "total_hours",
                                    Number.parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-12 text-center text-xl font-bold border-0 bg-transparent focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                style={{
                                  color: theme === 'dark' ? '#F3F4F6' : '#111827'
                                }}
                                step="0.5"
                                min="0"
                                max="24"
                              />
                              {dayTimesheet.overtime_hours > 0 && (
                                <div 
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
                                  style={{
                                    color: '#ea580c',
                                    backgroundColor: theme === 'dark' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(234, 88, 12, 0.1)'
                                  }}
                                >
                                  +{dayTimesheet.overtime_hours}h OT
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCellClick(day, workerId)}
                            className="w-full h-12 text-2xl font-light hover:bg-primary/10 hover:text-primary transition-all"
                            style={{
                              color: theme === 'dark' ? '#374151' : '#D1D5DB'
                            }}
                          >
                            +
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

