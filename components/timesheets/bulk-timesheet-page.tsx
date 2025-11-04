"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { User } from "@supabase/supabase-js"
import { Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BulkTimesheetForm } from "@/components/timesheets/bulk/BulkTimesheetForm"
import { TimesheetSelectionSection } from "@/components/timesheets/timesheet-selection-section"
import { useBulkTimesheetState } from "@/components/timesheets/bulk/useBulkTimesheetState"
import { fetchProjectsForCompany, fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import type { TimesheetWithDetails } from "@/lib/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface BulkTimesheetPageProps {
  user: User
}

export default function BulkTimesheetPage({ user }: BulkTimesheetPageProps) {
  const { theme } = useTheme()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const router = useRouter()

  // Selection state managed by custom hook
  const {
    selectedProject,
    selectedDates,
    selectedWorkers,
    onToggleWorker,
    onSelectAllWorkers,
    onClearWorkers,
    setSelectedProject,
    setSelectedDates,
  } = useBulkTimesheetState()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [workersData, projectsData] = await Promise.all([
        fetchWorkersForCompany(user.id),
        fetchProjectsForCompany(user.id)
      ])
      
      setWorkers(workersData)
      setProjects(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
      toast.error("Failed to load workers and projects")
    } finally {
      setLoading(false)
    }
  }, [user.id])

  const handleSuccess = async (timesheets: TimesheetWithDetails[]) => {
    setSubmissionSuccess(true)
    toast.success(`Successfully created ${timesheets.length} timesheet entries!`)
    
    // Redirect back to timesheets page after a short delay
    setTimeout(() => {
      router.push('/dashboard/timesheets')
    }, 2000)
  }


  useEffect(() => {
    loadData()
  }, [loadData])

  // Header actions are now handled by the wrapper component

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock 
              className="h-8 w-8 animate-spin mx-auto mb-4"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            />
            <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Loading bulk timesheet form...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden h-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Success Message */}
      {submissionSuccess && (
        <div className="p-6">
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All timesheet entries were successfully created! Redirecting to timesheets page...
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Selection Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <TimesheetSelectionSection
          projects={projects}
          workers={workers}
          selectedProject={selectedProject}
          selectedDates={selectedDates}
          selectedWorkers={selectedWorkers}
          onToggleWorker={onToggleWorker}
          onSelectAllWorkers={() => onSelectAllWorkers(workers)}
          onClearWorkers={onClearWorkers}
          onProjectChange={setSelectedProject}
          onDatesChange={setSelectedDates}
        />
      </div>

      {/* Bulk Timesheet Form - Full Width */}
      <BulkTimesheetForm
        userId={user.id}
        workers={workers}
        selectedProject={selectedProject}
        selectedDates={selectedDates}
        selectedWorkers={selectedWorkers}
        onSuccess={handleSuccess}
      />
    </div>
  )
} 