"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  FolderKanban,
  MapPin,
  Building2,
  Calendar,
  Users,
  DollarSign,
  Edit2,
  ChevronRight,
  Receipt,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { getProject } from "@/lib/data/projects"
import { getProjectAssignments } from "@/lib/data/project-assignments"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import type { ProjectWithDetails } from "@/lib/types/project"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { format, parseISO } from "date-fns"

interface TeamMember {
  id: string
  name: string
  position?: string
  role_on_project?: string
}

interface TimesheetSummary {
  total_hours: number
  total_pay: number
  entry_count: number
}

interface FinancialSummary {
  estimatedLabor: number
  actualLabor: number
  invoicedAmount: number
  outstandingBalance: number
  invoiceCount: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BS", {
    style: "currency",
    currency: "BSD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function MobileProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [timesheetSummary, setTimesheetSummary] = useState<TimesheetSummary>({
    total_hours: 0,
    total_pay: 0,
    entry_count: 0,
  })
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    estimatedLabor: 0,
    actualLabor: 0,
    invoicedAmount: 0,
    outstandingBalance: 0,
    invoiceCount: 0,
  })
  const [projectProgress, setProjectProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadProjectData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Not authenticated")
        return
      }

      const profile = await getUserProfileWithCompany()
      if (!profile?.company_id) {
        setError("Company not found")
        return
      }

      // Load project details
      const projectResult = await getProject(profile.company_id, params.id as string)
      if (!projectResult.success || !projectResult.data) {
        setError(projectResult.error || "Project not found")
        return
      }
      setProject(projectResult.data)

      // Load project assignments (team members)
      const assignmentsResult = await getProjectAssignments(profile.company_id, {
        project_id: params.id as string,
        is_active: true,
      })
      if (assignmentsResult.success && assignmentsResult.data) {
        const members = assignmentsResult.data.map((a) => ({
          id: a.worker_id,
          name: a.worker?.name || "Unknown",
          position: a.worker?.position,
          role_on_project: a.role_on_project,
        }))
        setTeamMembers(members)
      }

      // Load timesheet summary for this project
      const { data: timesheets } = await supabase
        .from("timesheets")
        .select("total_hours, total_pay")
        .eq("project_id", params.id as string)
        .eq("company_id", profile.company_id)

      if (timesheets) {
        const summary = timesheets.reduce<TimesheetSummary>(
          (acc, ts) => ({
            total_hours: acc.total_hours + (ts.total_hours || 0),
            total_pay: acc.total_pay + (ts.total_pay || 0),
            entry_count: acc.entry_count + 1,
          }),
          { total_hours: 0, total_pay: 0, entry_count: 0 }
        )
        setTimesheetSummary(summary)
      }

      // Load invoice data for financial summary
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total_amount, amount_paid")
        .eq("project_id", params.id as string)
        .eq("company_id", profile.company_id)

      if (invoices && projectResult.data) {
        const invoicedAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        const paidAmount = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
        // Use payroll_budget directly from database (no fallback calculation)
        const estimatedLaborCost = projectResult.data.payroll_budget || 0

        setFinancialSummary({
          estimatedLabor: estimatedLaborCost,
          actualLabor: timesheets?.reduce((sum, ts) => sum + (ts.total_pay || 0), 0) || 0,
          invoicedAmount,
          outstandingBalance: invoicedAmount - paidAmount,
          invoiceCount: invoices.length,
        })
      }

      // Calculate project progress
      if (projectResult.data) {
        const p = projectResult.data
        let progress = 0
        if (p.status === 'completed') progress = 100
        else if (p.status === 'cancelled' || p.status === 'not_started') progress = 0
        else if (p.start_date && (p.end_date || p.estimated_end_date)) {
          const start = new Date(p.start_date).getTime()
          const end = new Date(p.end_date || p.estimated_end_date!).getTime()
          const now = Date.now()
          progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
        } else if (p.status === 'in_progress' || p.status === 'paused') {
          progress = 50
        }
        setProjectProgress(Math.round(progress))
      }
    } catch (err) {
      console.error("Error loading project:", err)
      setError("Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0">Completed</Badge>
        )
      case "paused":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0">On Hold</Badge>
        )
      case "not_started":
        return (
          <Badge className="bg-gray-100 text-gray-600 border-0">Not Started</Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 border-0">Cancelled</Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not set"
    try {
      return format(parseISO(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
              Project Details
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => router.back()}
            className="text-[#2596be] font-medium"
          >
            Go Back
          </button>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center truncate px-2">
            {project.name}
          </h1>
          <button
            onClick={() => {
              // Placeholder for edit functionality
              // Could open a bottom sheet or navigate to edit page
            }}
            className="p-2 -mr-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Edit project"
          >
            <Edit2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Project Header Card with Progress */}
      <div className="bg-white px-5 py-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#2596be]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-7 h-7 text-[#2596be]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900 truncate flex-1">
                {project.name}
              </h2>
              {getStatusBadge(project.status)}
            </div>
            {project.client && (
              <p className="text-sm text-gray-500 mt-0.5">
                {project.client.company || project.client.name}
              </p>
            )}
            {(project.start_date || project.end_date || project.estimated_end_date) && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(project.start_date)} → {formatDate(project.end_date || project.estimated_end_date)}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">Overall Progress</span>
            <span className="text-xs font-semibold text-gray-900">{projectProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#2596be] transition-all duration-500"
              style={{ width: `${projectProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financial Snapshot - 4 Card Grid */}
      <div className="px-5 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Financial Snapshot
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Est. Labor Budget */}
          <div className="bg-[#E8EDF5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#2596be]" />
              <span className="text-xs text-gray-600">Est. Labor</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(financialSummary.estimatedLabor)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Budget allocated</p>
          </div>

          {/* Actual Labor */}
          <div className="bg-[#E8EDF5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#2596be]" />
              <span className="text-xs text-gray-600">Actual Labor</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(financialSummary.actualLabor)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {financialSummary.estimatedLabor > 0
                ? `${((financialSummary.actualLabor / financialSummary.estimatedLabor) * 100).toFixed(0)}% of budget`
                : `${timesheetSummary.total_hours.toFixed(1)}h logged`
              }
            </p>
          </div>

          {/* Invoiced */}
          <div className="bg-[#E8EDF5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-[#2596be]" />
              <span className="text-xs text-gray-600">Invoiced</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(financialSummary.invoicedAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {financialSummary.invoiceCount} invoice{financialSummary.invoiceCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Outstanding */}
          <div className="bg-[#E8EDF5] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className={`w-4 h-4 ${financialSummary.outstandingBalance > 0 ? 'text-amber-500' : 'text-green-500'}`} />
              <span className="text-xs text-gray-600">Outstanding</span>
            </div>
            <p className={`text-xl font-bold ${financialSummary.outstandingBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(financialSummary.outstandingBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {financialSummary.outstandingBalance > 0 ? 'Pending payment' : 'All paid'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Project Details
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {/* Client */}
          {project.client && (
            <button
              onClick={() => router.push(`/dashboard/clients/${project.client?.id}`)}
              className="w-full p-4 flex items-center gap-3 active:bg-gray-50"
            >
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.client.name}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          )}

          {/* Location */}
          {project.location && (
            <div className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.location}
                </p>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(project.start_date)}
              </p>
            </div>
          </div>

          {/* End Date */}
          {(project.end_date || project.estimated_end_date) && (
            <div className="p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">
                  {project.end_date ? "End Date" : "Estimated End"}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(project.end_date || project.estimated_end_date)}
                </p>
              </div>
            </div>
          )}

          {/* Budget */}
          {project.budget && project.budget > 0 && (
            <div className="p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Total Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  ${project.budget.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Team Members
          </h3>
          <span className="text-xs text-gray-400">{teamMembers.length} assigned</span>
        </div>
        {teamMembers.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {teamMembers.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => router.push(`/dashboard/workers/${member.id}`)}
                className="w-full p-4 flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-[#2596be]/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#2596be]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {member.role_on_project || member.position || "Worker"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
            {teamMembers.length > 5 && (
              <div className="p-4 text-center">
                <p className="text-sm text-[#2596be] font-medium">
                  +{teamMembers.length - 5} more team members
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No team members assigned</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="px-5 pt-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Notes
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {project.notes}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
