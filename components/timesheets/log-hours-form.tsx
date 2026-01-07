"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react"
import { createTimesheet } from "@/lib/data/timesheets"
import { useTimesheetSettings } from "@/lib/hooks/use-timesheet-settings"
import type { Worker, Project, CreateTimesheetInput } from "@/lib/types"

interface LogHoursFormProps {
  userId: string
  workers: Worker[]
  projects: Project[]
  companyId: string
}

type DateOption = "today" | "yesterday" | "custom"

interface TimeValue {
  hours: number
  minutes: number
}

/**
 * Format a Date to YYYY-MM-DD string
 */
function formatDateToString(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Format a Date for display (e.g., "Friday, January 3")
 */
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format time value to HH:mm string
 */
function formatTimeToString(time: TimeValue): string {
  return `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`
}

/**
 * Format time for display (e.g., "7:00 AM")
 */
function formatTimeDisplay(time: TimeValue): string {
  const hours = time.hours % 12 || 12
  const ampm = time.hours >= 12 ? "PM" : "AM"
  const minutes = time.minutes.toString().padStart(2, "0")
  return `${hours}:${minutes} ${ampm}`
}

/**
 * Calculate total hours between start and end times
 */
function calculateTotalHours(
  start: TimeValue,
  end: TimeValue,
  breakMinutes: number
): number {
  const startMinutes = start.hours * 60 + start.minutes
  const endMinutes = end.hours * 60 + end.minutes
  const totalMinutes = endMinutes - startMinutes - breakMinutes
  return Math.max(0, totalMinutes / 60)
}

/**
 * Get today's date
 */
function getToday(): Date {
  return new Date()
}

/**
 * Get yesterday's date
 */
function getYesterday(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date
}

/**
 * Parse a TIME string (HH:MM or HH:MM:SS) to TimeValue
 * Example: "07:00:00" or "07:00" -> { hours: 7, minutes: 0 }
 */
function parseTimeString(timeStr: string): TimeValue {
  const parts = timeStr.split(":")
  const hours = parseInt(parts[0] || "0", 10)
  const minutes = parseInt(parts[1] || "0", 10)
  return { hours, minutes }
}

export function LogHoursForm({
  userId,
  workers,
  projects,
  companyId,
}: LogHoursFormProps) {
  const router = useRouter()

  // Load timesheet settings from database
  const { settings: timesheetSettings, loading: settingsLoading } = useTimesheetSettings()

  // Form state - default values will be overridden when settings load
  const [dateOption, setDateOption] = useState<DateOption>("today")
  const [customDates, setCustomDates] = useState<string[]>([formatDateToString(getToday())])
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    projects.length === 1 ? projects[0] : null
  )
  const [startTime, setStartTime] = useState<TimeValue>({ hours: 7, minutes: 0 })
  const [endTime, setEndTime] = useState<TimeValue>({ hours: 15, minutes: 30 })
  const [breakMinutes, setBreakMinutes] = useState(30)
  const [notes, setNotes] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  
  // Update times when settings load from database
  useEffect(() => {
    if (timesheetSettings && !settingsLoading) {
      // Parse work_day_start (e.g., "07:00:00" or "07:00") to TimeValue
      if (timesheetSettings.work_day_start) {
        const parsedStart = parseTimeString(timesheetSettings.work_day_start)
        setStartTime(parsedStart)
      }
      
      // Parse work_day_end (e.g., "16:00:00" or "16:00") to TimeValue
      if (timesheetSettings.work_day_end) {
        const parsedEnd = parseTimeString(timesheetSettings.work_day_end)
        setEndTime(parsedEnd)
      }
      
      // Set break time (already in minutes)
      if (timesheetSettings.break_time !== undefined) {
        setBreakMinutes(timesheetSettings.break_time)
      }
    }
  }, [timesheetSettings, settingsLoading])

  // UI state
  const [showWorkerSearch, setShowWorkerSearch] = useState(false)
  const [showProjectSelect, setShowProjectSelect] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(null)
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)
  const [workerSearchQuery, setWorkerSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed values
  const selectedDates = useMemo(() => {
    if (dateOption === "today") return [getToday()]
    if (dateOption === "yesterday") return [getYesterday()]
    return customDates.map((d) => new Date(d + "T00:00:00"))
  }, [dateOption, customDates])

  // For backward compatibility and display
  const selectedDate = selectedDates[0]

  const dateDisplayText = useMemo(() => {
    if (selectedDates.length === 1) {
      return formatDateDisplay(selectedDates[0])
    }
    return `${selectedDates.length} dates selected`
  }, [selectedDates])

  const totalHours = useMemo(
    () => calculateTotalHours(startTime, endTime, breakMinutes),
    [startTime, endTime, breakMinutes]
  )

  const filteredWorkers = useMemo(() => {
    if (!workerSearchQuery) return workers
    const query = workerSearchQuery.toLowerCase()
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.role?.toLowerCase().includes(query)
    )
  }, [workers, workerSearchQuery])

  const isFormValid =
    selectedWorkers.length > 0 &&
    selectedProject !== null &&
    totalHours > 0 &&
    totalHours <= 16

  // Handlers
  const handleDateOptionChange = (option: DateOption) => {
    if (option === "custom") {
      setShowDatePickerModal(true)
    } else {
      setDateOption(option)
    }
  }

  const handleAddWorker = (worker: Worker) => {
    if (!selectedWorkers.find((w) => w.id === worker.id)) {
      setSelectedWorkers([...selectedWorkers, worker])
    }
    // Clear search query but keep the list open for multi-select
    setWorkerSearchQuery("")
    // Don't close the worker search - allow multiple selections
    // setShowWorkerSearch(false) - Removed to allow multi-select
  }

  const handleRemoveWorker = (workerId: string) => {
    setSelectedWorkers(selectedWorkers.filter((w) => w.id !== workerId))
  }

  const handleQuickTime = (hours: number) => {
    // Use timesheet settings if available, otherwise use defaults
    const defaultStart = timesheetSettings?.work_day_start ? parseTimeString(timesheetSettings.work_day_start) : { hours: 7, minutes: 0 }
    const defaultBreak = timesheetSettings?.break_time ?? 30
    
    // Calculate end time: start time + target hours + break time
    const startMinutes = defaultStart.hours * 60 + defaultStart.minutes
    const targetMinutes = hours * 60 // Target work hours in minutes
    const breakMins = hours === 4 ? Math.floor(defaultBreak / 2) : defaultBreak // Half break for half day
    const totalMinutes = startMinutes + targetMinutes + breakMins
    
    // Convert back to hours and minutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    
    setStartTime(defaultStart)
    setEndTime({ hours: endHours, minutes: endMinutes })
    setBreakMinutes(breakMins)
  }

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const clockIn = formatTimeToString(startTime)
    const clockOut = formatTimeToString(endTime)

    try {
      // Create timesheet for each selected worker AND each selected date
      const allInputs: { worker: Worker; dateString: string }[] = []
      for (const worker of selectedWorkers) {
        for (const date of selectedDates) {
          allInputs.push({ worker, dateString: formatDateToString(date) })
        }
      }

      const results = await Promise.all(
        allInputs.map(({ worker, dateString }) => {
          const input: CreateTimesheetInput = {
            date: dateString,
            worker_id: worker.id,
            project_id: selectedProject!.id,
            clock_in: clockIn,
            clock_out: clockOut,
            break_duration: breakMinutes,
            task_description: "",
            notes: notes || undefined,
            regular_hours: Math.min(totalHours, 8),
            overtime_hours: Math.max(0, totalHours - 8),
            total_hours: totalHours,
            total_pay: 0, // Calculated server-side
          }
          return createTimesheet(userId, input)
        })
      )

      // Check for errors
      const errors = results.filter((r) => !r.success)
      if (errors.length > 0) {
        setError(errors[0].error || "Failed to log hours")
        setIsSubmitting(false)
        return
      }

      setShowSuccess(true)
    } catch (err) {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleLogAnother = () => {
    setSelectedWorkers([])
    setNotes("")
    setShowSuccess(false)
    setIsSubmitting(false)
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Hours Logged
          </h1>

          <div className="text-center text-gray-600 mb-8">
            <p className="font-medium">
              {selectedWorkers.length === 1
                ? selectedWorkers[0].name
                : `${selectedWorkers.length} workers`}
            </p>
            <p className="text-sm mt-1">
              {totalHours} hours on {selectedProject?.name}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {formatDateDisplay(selectedDate)}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={handleLogAnother}
              className="w-full h-12 bg-[#2596be] text-white font-semibold rounded-xl
                         transition-all active:scale-[0.98]"
            >
              Log Another
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 text-gray-600 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Log Hours</h1>
      </header>

      <div className="px-5 py-5 space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Date Selector */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-base font-medium text-gray-900">
              {dateDisplayText}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDateOptionChange("today")}
              className={`flex-1 h-11 rounded-lg font-medium text-sm transition-all
                ${
                  dateOption === "today"
                    ? "bg-[#2596be] text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateOptionChange("yesterday")}
              className={`flex-1 h-11 rounded-lg font-medium text-sm transition-all
                ${
                  dateOption === "yesterday"
                    ? "bg-[#2596be] text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => handleDateOptionChange("custom")}
              className={`flex-1 h-11 rounded-lg font-medium text-sm transition-all
                ${
                  dateOption === "custom"
                    ? "bg-[#2596be] text-white"
                    : "bg-white border border-gray-200 text-gray-700"
                }`}
            >
              Other
            </button>
          </div>
        </section>

        {/* Worker Selection */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workers
          </label>

          {/* Selected Workers */}
          {selectedWorkers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center gap-2 h-10 px-3 bg-[#2596be]/10
                             border border-[#2596be]/30 rounded-lg"
                >
                  <span className="text-sm font-medium text-[#2596be]">
                    {worker.name}
                  </span>
                  <button
                    onClick={() => handleRemoveWorker(worker.id)}
                    className="w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-[#2596be]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Worker Button / Search */}
          {showWorkerSearch ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={workerSearchQuery}
                  onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  placeholder="Search workers..."
                  autoFocus
                  className="w-full h-12 pl-10 pr-10 bg-white border border-gray-200 rounded-xl
                             text-base placeholder:text-gray-400"
                />
                <button
                  onClick={() => {
                    setShowWorkerSearch(false)
                    setWorkerSearchQuery("")
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8
                             flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Worker List */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {filteredWorkers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No workers found
                  </div>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isSelected = selectedWorkers.some(
                      (w) => w.id === worker.id
                    )
                    return (
                      <button
                        key={worker.id}
                        onClick={() => !isSelected && handleAddWorker(worker)}
                        disabled={isSelected}
                        className={`w-full flex items-center justify-between p-3 border-b border-gray-100 last:border-0
                          ${isSelected ? "bg-gray-50" : "active:bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {worker.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">
                              {worker.name}
                            </p>
                            {worker.role && (
                              <p className="text-xs text-gray-500 capitalize">
                                {worker.role}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[#2596be]" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowWorkerSearch(true)}
              className="w-full h-12 flex items-center justify-center gap-2
                         bg-white border border-gray-200 border-dashed rounded-xl
                         text-gray-600 font-medium text-sm
                         transition-all active:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Worker
            </button>
          )}
        </section>

        {/* Project Selection */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>

          {showProjectSelect ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No active projects
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project)
                      setShowProjectSelect(false)
                    }}
                    className="w-full flex items-center justify-between p-3 border-b border-gray-100 last:border-0
                               active:bg-gray-50"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {project.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    {selectedProject?.id === project.id && (
                      <Check className="w-5 h-5 text-[#2596be]" />
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowProjectSelect(true)}
              className="w-full h-14 flex items-center justify-between px-4
                         bg-white border border-gray-200 rounded-xl
                         transition-all active:bg-gray-50"
            >
              {selectedProject ? (
                <div className="text-left">
                  <p className="text-base font-medium text-gray-900">
                    {selectedProject.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {selectedProject.status.replace(/_/g, " ")}
                  </p>
                </div>
              ) : (
                <span className="text-gray-400">Select project...</span>
              )}
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </section>

        {/* Time Entry */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours
          </label>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Start
              </p>
              <button
                onClick={() => setShowTimePicker("start")}
                className="w-full h-16 bg-white border border-gray-200 rounded-xl
                           flex items-center justify-center
                           transition-all active:bg-gray-50"
              >
                <span className="text-2xl font-semibold text-gray-900">
                  {formatTimeDisplay(startTime)}
                </span>
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                End
              </p>
              <button
                onClick={() => setShowTimePicker("end")}
                className="w-full h-16 bg-white border border-gray-200 rounded-xl
                           flex items-center justify-center
                           transition-all active:bg-gray-50"
              >
                <span className="text-2xl font-semibold text-gray-900">
                  {formatTimeDisplay(endTime)}
                </span>
              </button>
            </div>
          </div>

          {/* Total Hours Display */}
          <div className="flex items-center gap-2 px-1 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {totalHours.toFixed(1)} hours
              </span>
              {totalHours > 8 && (
                <span className="text-amber-600 ml-1">
                  (incl. {(totalHours - 8).toFixed(1)}h overtime)
                </span>
              )}
            </span>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickTime(8)}
              className="flex-1 h-10 bg-gray-100 rounded-lg text-sm font-medium text-gray-700
                         transition-all active:bg-gray-200"
            >
              8 hrs
            </button>
            <button
              onClick={() => handleQuickTime(10)}
              className="flex-1 h-10 bg-gray-100 rounded-lg text-sm font-medium text-gray-700
                         transition-all active:bg-gray-200"
            >
              10 hrs
            </button>
            <button
              onClick={() => handleQuickTime(4)}
              className="flex-1 h-10 bg-gray-100 rounded-lg text-sm font-medium text-gray-700
                         transition-all active:bg-gray-200"
            >
              Half day
            </button>
          </div>
        </section>

        {/* Optional Details */}
        <section>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full py-2"
          >
            <span className="text-sm font-medium text-[#2596be]">
              Additional Details
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-[#2596be]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#2596be]" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-4 bg-gray-50 rounded-xl p-4">
              {/* Break Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Time
                </label>
                <select
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl
                             text-base text-gray-900"
                >
                  <option value={0}>No break</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
                             text-base placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePicker
          value={showTimePicker === "start" ? startTime : endTime}
          onChange={(time) => {
            if (showTimePicker === "start") {
              setStartTime(time)
            } else {
              setEndTime(time)
            }
          }}
          onClose={() => setShowTimePicker(null)}
          label={showTimePicker === "start" ? "Start Time" : "End Time"}
        />
      )}

      {/* Date Picker Modal */}
      {showDatePickerModal && (
        <DatePickerModal
          selectedDates={customDates}
          onConfirm={(dates) => {
            setCustomDates(dates)
            setDateOption("custom")
            setShowDatePickerModal(false)
          }}
          onClose={() => setShowDatePickerModal(false)}
        />
      )}

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`w-full h-14 rounded-xl font-semibold text-base
                      flex items-center justify-center gap-2
                      transition-all active:scale-[0.98]
            ${
              isFormValid && !isSubmitting
                ? "bg-[#2596be] text-white"
                : "bg-gray-200 text-gray-400"
            }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Logging...
            </>
          ) : selectedWorkers.length > 1 ? (
            `Log Hours for ${selectedWorkers.length} Workers`
          ) : (
            "Log Hours"
          )}
        </button>

        {selectedWorkers.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Select at least one worker
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Time Picker Modal Component
 */
function TimePicker({
  value,
  onChange,
  onClose,
  label,
}: {
  value: TimeValue
  onChange: (time: TimeValue) => void
  onClose: () => void
  label: string
}) {
  const [tempHours, setTempHours] = useState(value.hours)
  const [tempMinutes, setTempMinutes] = useState(value.minutes)

  const handleDone = () => {
    onChange({ hours: tempHours, minutes: tempMinutes })
    onClose()
  }

  // Generate hour options (5 AM to 11 PM)
  const hourOptions = Array.from({ length: 19 }, (_, i) => i + 5)

  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45]

  // Common time presets
  const presets = [
    { label: "6:00 AM", hours: 6, minutes: 0 },
    { label: "6:30 AM", hours: 6, minutes: 30 },
    { label: "7:00 AM", hours: 7, minutes: 0 },
    { label: "7:30 AM", hours: 7, minutes: 30 },
    { label: "3:00 PM", hours: 15, minutes: 0 },
    { label: "3:30 PM", hours: 15, minutes: 30 },
    { label: "4:00 PM", hours: 16, minutes: 0 },
    { label: "4:30 PM", hours: 16, minutes: 30 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 font-medium">
            Cancel
          </button>
          <span className="font-semibold text-gray-900">{label}</span>
          <button onClick={handleDone} className="text-[#2596be] font-semibold">
            Done
          </button>
        </div>

        {/* Time Display */}
        <div className="py-6 text-center">
          <span className="text-4xl font-bold text-gray-900">
            {formatTimeDisplay({ hours: tempHours, minutes: tempMinutes })}
          </span>
        </div>

        {/* Time Selectors */}
        <div className="flex justify-center gap-4 px-5 pb-4">
          {/* Hour Selector */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase text-center mb-2">
              Hour
            </p>
            <select
              value={tempHours}
              onChange={(e) => setTempHours(Number(e.target.value))}
              className="w-full h-12 text-center text-lg font-medium bg-gray-100 rounded-xl border-0"
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {h > 12 ? h - 12 : h === 0 ? 12 : h} {h >= 12 ? "PM" : "AM"}
                </option>
              ))}
            </select>
          </div>

          {/* Minute Selector */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase text-center mb-2">
              Minute
            </p>
            <select
              value={tempMinutes}
              onChange={(e) => setTempMinutes(Number(e.target.value))}
              className="w-full h-12 text-center text-lg font-medium bg-gray-100 rounded-xl border-0"
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>
                  :{m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pb-6">
          <p className="text-xs text-gray-500 uppercase mb-2">Common times</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setTempHours(preset.hours)
                  setTempMinutes(preset.minutes)
                }}
                className={`h-9 px-3 rounded-lg text-sm font-medium transition-all
                  ${
                    tempHours === preset.hours && tempMinutes === preset.minutes
                      ? "bg-[#2596be] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Date Picker Modal Component with multi-select calendar
 */
function DatePickerModal({
  selectedDates,
  onConfirm,
  onClose,
}: {
  selectedDates: string[]
  onConfirm: (dates: string[]) => void
  onClose: () => void
}) {
  const [tempSelectedDates, setTempSelectedDates] = useState<Set<string>>(
    new Set(selectedDates)
  )
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() }
  })

  const today = new Date()
  const todayString = formatDateToString(today)

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1)
    const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0)

    // Add padding for days before the first day of the month
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(calendarMonth.year, calendarMonth.month, -i)
      days.push(d)
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(calendarMonth.year, calendarMonth.month, d))
    }

    // Add padding for days after the last day of the month
    const endPadding = 6 - lastDay.getDay()
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(calendarMonth.year, calendarMonth.month + 1, i))
    }

    return days
  }, [calendarMonth])

  const toggleDate = (date: Date) => {
    const dateString = formatDateToString(date)
    setTempSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateString)) {
        next.delete(dateString)
      } else {
        next.add(dateString)
      }
      return next
    })
  }

  const handleConfirm = () => {
    const sortedDates = Array.from(tempSelectedDates).sort()
    if (sortedDates.length > 0) {
      onConfirm(sortedDates)
    }
  }

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 font-medium">
            Cancel
          </button>
          <span className="font-semibold text-gray-900">Select Dates</span>
          <button
            onClick={handleConfirm}
            disabled={tempSelectedDates.size === 0}
            className={`font-semibold ${
              tempSelectedDates.size > 0 ? "text-[#2596be]" : "text-gray-300"
            }`}
          >
            Confirm
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900">
            {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString(
              "en-US",
              { month: "long", year: "numeric" }
            )}
          </span>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="px-5 pb-6">
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((date, i) => {
              const dateString = formatDateToString(date)
              const isCurrentMonth = date.getMonth() === calendarMonth.month
              const isSelected = tempSelectedDates.has(dateString)
              const isToday = dateString === todayString
              const isFuture = date > today
              const isPastLimit =
                date < new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
              const isDisabled = isFuture || isPastLimit || !isCurrentMonth

              return (
                <button
                  key={i}
                  onClick={() => !isDisabled && toggleDate(date)}
                  disabled={isDisabled}
                  className={`
                    h-11 flex items-center justify-center rounded-lg text-sm font-medium
                    transition-all
                    ${isDisabled ? "text-gray-300 cursor-not-allowed" : ""}
                    ${!isDisabled && !isSelected ? "text-gray-900 hover:bg-gray-100 active:bg-gray-200" : ""}
                    ${isSelected ? "bg-[#2596be] text-white" : ""}
                    ${isToday && !isSelected ? "ring-2 ring-[#2596be] ring-inset text-[#2596be]" : ""}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Selected count */}
          {tempSelectedDates.size > 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              {tempSelectedDates.size} date{tempSelectedDates.size !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
