"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  ClipboardList,
  Building2,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { getWorker } from "@/lib/data/workers"
import { getTimesheets } from "@/lib/data/timesheets"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import type { WorkerWithDetails } from "@/lib/types/worker"
import type { TimesheetWithDetails } from "@/lib/types"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"

export function MobileWorkerDetail() {
  const router = useRouter()
  const params = useParams()
  const [worker, setWorker] = useState<WorkerWithDetails | null>(null)
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkerData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadWorkerData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Not authenticated")
        return
      }

      const profile = await getUserProfileWithCompany()
      if (!profile?.company_id) {
        setError("Company not found")
        return
      }

      // Load worker details
      const workerResult = await getWorker(profile.company_id, params.id as string)
      if (!workerResult.success || !workerResult.data) {
        setError(workerResult.error || "Worker not found")
        return
      }
      setWorker(workerResult.data)

      // Load timesheets for this week
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

      const timesheetsResult = await getTimesheets(user.id, {
        worker_id: params.id as string,
        date_from: format(weekStart, "yyyy-MM-dd"),
        date_to: format(weekEnd, "yyyy-MM-dd"),
        limit: 50,
      })

      if (timesheetsResult.success && timesheetsResult.data) {
        setTimesheets(timesheetsResult.data)
      }
    } catch (err) {
      console.error("Error loading worker:", err)
      setError("Failed to load worker details")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate this week's stats
  const weeklyHours = timesheets.reduce((sum, ts) => sum + (ts.total_hours || 0), 0)
  const weeklyEarnings = worker ? weeklyHours * worker.hourly_rate : 0

  // Get unique recent projects from timesheets
  const recentProjects = timesheets
    .filter((ts) => ts.project)
    .reduce((acc, ts) => {
      if (ts.project && !acc.find((p) => p.id === ts.project!.id)) {
        acc.push({
          id: ts.project.id,
          name: ts.project.name,
          lastWorked: ts.date,
        })
      }
      return acc
    }, [] as { id: string; name: string; lastWorked: string }[])
    .slice(0, 3)

  // Also include projects from worker's current assignments
  const allProjects = worker?.current_projects
    ? worker.current_projects
        .filter((a) => a.project)
        .map((a) => ({
          id: a.project.id,
          name: a.project.name,
          lastWorked: null as string | null,
        }))
        .filter((p) => !recentProjects.find((rp) => rp.id === p.id))
    : []

  const displayProjects = [...recentProjects, ...allProjects].slice(0, 3)

  const handleCall = () => {
    if (worker?.phone) {
      window.location.href = `tel:${worker.phone}`
    }
  }

  const handleText = () => {
    if (worker?.phone) {
      window.location.href = `sms:${worker.phone}`
    }
  }

  const handleLogHours = () => {
    // Navigate to log hours page with worker pre-selected
    router.push(`/dashboard/timesheets/new?worker=${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading worker...</p>
        </div>
      </div>
    )
  }

  if (error || !worker) {
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
              Worker Details
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 mb-4">{error || "Worker not found"}</p>
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
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8 truncate">
            {worker.name}
          </h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white px-5 py-6 border-b border-gray-100">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarFallback className="text-2xl bg-[#2596be] text-white font-semibold">
              {getInitials(worker.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-gray-900">{worker.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {worker.position || "Worker"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={
                worker.is_active
                  ? "bg-green-100 text-green-700 border-0"
                  : "bg-gray-100 text-gray-600 border-0"
              }
            >
              {worker.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">${worker.hourly_rate}/hr</span>
          </div>
        </div>

        {/* Quick Actions */}
        {worker.phone && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-2 h-11 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button
              onClick={handleText}
              className="flex items-center justify-center gap-2 h-11 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Text
            </button>
          </div>
        )}
      </div>

      {/* This Week Stats */}
      <div className="px-5 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          This Week
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Hours</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyHours.toFixed(1)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${weeklyEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Projects
        </h3>
        {displayProjects.length > 0 ? (
          <div className="space-y-3">
            {displayProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {project.name}
                    </p>
                    {project.lastWorked && (
                      <p className="text-xs text-gray-500">
                        Last worked: {format(parseISO(project.lastWorked), "MMM d")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent projects</p>
          </div>
        )}
      </div>

      {/* Log Hours CTA */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={handleLogHours}
          className="w-full flex items-center justify-center gap-2 h-12 bg-[#2596be] hover:bg-[#1e7a9a] text-white font-semibold rounded-xl shadow-md shadow-[#2596be]/20 transition-all active:scale-[0.98]"
        >
          <ClipboardList className="w-5 h-5" />
          Log Hours for {worker.name.split(" ")[0]}
        </button>
      </div>

      {/* Contact Info */}
      {(worker.email || worker.phone) && (
        <div className="px-5 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Contact Info
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {worker.email && (
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">{worker.email}</p>
              </div>
            )}
            {worker.phone && (
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-900">{worker.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
