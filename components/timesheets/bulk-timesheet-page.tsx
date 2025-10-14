"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { User } from "@supabase/supabase-js"
import { ArrowLeft, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BulkTimesheetForm } from "@/components/forms/bulk-timesheet-form"
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

  const handleCancel = () => {
    router.push('/dashboard/timesheets')
  }

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
    <div className="flex-1 space-y-6 p-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/timesheets" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Timesheets
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Entry</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>



      {/* Success Message */}
      {submissionSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All timesheet entries were successfully created! Redirecting to timesheets page...
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <div className="space-y-6">
        <div className="space-y-4 mb-8">
          <h2 
            className="text-xl font-semibold"
            style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
          >
            Create Timesheet Entries
          </h2>
          <p 
            className="mt-1"
            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >
            Select a project, individual dates, and workers to create multiple timesheet entries at once. 
            Use the quick templates or pick specific dates to match your construction schedule.
          </p>
        </div>
        
        <BulkTimesheetForm
          userId={user.id}
          workers={workers}
          projects={projects}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
} 