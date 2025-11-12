"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BulkTimesheetForm } from "@/components/timesheets/bulk/BulkTimesheetForm"
import { TimesheetSelectionSection } from "@/components/timesheets/timesheet-selection-section"
import { useBulkTimesheetState } from "@/components/timesheets/bulk/useBulkTimesheetState"
import { useCompanyData } from "@/lib/hooks/use-company-data"
import type { TimesheetWithDetails } from "@/lib/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const REDIRECT_DELAY_MS = 2000

interface BulkTimesheetPageProps {
  user: User
}

export default function BulkTimesheetPage({ user }: BulkTimesheetPageProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch company data with shared hook (includes cleanup and error handling)
  const { workers, projects, loading, error, refetch } = useCompanyData(user.id)

  // Selection state managed by custom hook
  const bulkState = useBulkTimesheetState()

  // Cleanup redirect timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleSuccess = (timesheets: TimesheetWithDetails[]) => {
    toast.success(`Successfully created ${timesheets.length} timesheet entries!`, {
      description: "Redirecting to timesheets page...",
      duration: REDIRECT_DELAY_MS,
    })
    
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
    }
    
    // Redirect after delay
    redirectTimeoutRef.current = setTimeout(() => {
      router.push('/dashboard/timesheets')
    }, REDIRECT_DELAY_MS)
  }

  // Loading state with optimized skeleton UI
  if (loading) {
    return (
      <div 
        className="flex flex-col overflow-hidden" 
        style={{ 
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB',
          marginTop: '-0.75rem',
          marginBottom: '-1.5rem'
        }}
      >
        {/* Selection Section Skeleton */}
        <div className="shrink-0 w-full border-b backdrop-blur-sm border-slate-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="pl-6 pr-6 pt-2 pb-3 md:px-2">
            <div className="flex flex-wrap items-center gap-2">
              <div 
                className="h-10 w-32 rounded animate-pulse"
                style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#e5e7eb' }}
              />
              <div 
                className="h-10 w-32 rounded animate-pulse"
                style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#e5e7eb' }}
              />
              <div 
                className="h-10 w-32 rounded animate-pulse"
                style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#e5e7eb' }}
              />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="flex-1 min-h-0 px-4 lg:px-6 py-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
                  animation: `fadeIn 0.3s ease-out ${i * 0.1}s both`
                }}
              >
                <div className="space-y-3">
                  <div 
                    className="h-6 w-40 rounded animate-pulse"
                    style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#e5e7eb' }}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div 
                        key={j}
                        className="h-11 rounded animate-pulse"
                        style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry functionality
  if (error) {
    return (
      <div 
        className="flex-1 space-y-6 p-6"
        style={{
          backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB'
        }}
      >
        <Alert 
          variant="destructive"
          className="border-0 shadow-md"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={refetch} 
          variant="outline"
          className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col overflow-hidden" 
      style={{ 
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB',
        marginTop: '-0.75rem',
        marginBottom: '-1.5rem'
      }}
    >
      {/* Selection Section - Fixed at top */}
      <div className="shrink-0">
        <TimesheetSelectionSection
          projects={projects}
          workers={workers}
          selectedProject={bulkState.selectedProject}
          selectedDates={bulkState.selectedDates}
          selectedWorkers={bulkState.selectedWorkers}
          onToggleWorker={bulkState.onToggleWorker}
          onSelectAllWorkers={() => bulkState.onSelectAllWorkers(workers)}
          onClearWorkers={bulkState.onClearWorkers}
          onProjectChange={bulkState.setSelectedProject}
          onDatesChange={bulkState.setSelectedDates}
        />
      </div>

      {/* Bulk Timesheet Form - Takes remaining height with scrollable table and fixed summary */}
      <div className="flex-1 min-h-0">
        <BulkTimesheetForm
          userId={user.id}
          workers={workers}
          selectedProject={bulkState.selectedProject}
          selectedDates={bulkState.selectedDates}
          selectedWorkers={bulkState.selectedWorkers}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
 