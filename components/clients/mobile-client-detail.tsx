"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building2,
  FolderKanban,
  Edit2,
  MessageSquare,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { getClient } from "@/lib/data/clients"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import type { ClientWithDetails } from "@/lib/types/client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

interface ClientProject {
  id: string
  name: string
  status: string
}

export function MobileClientDetail() {
  const router = useRouter()
  const params = useParams()
  const [client, setClient] = useState<ClientWithDetails | null>(null)
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadClientData = async () => {
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

      // Load client details
      const clientResult = await getClient(profile.company_id, params.id as string)
      if (!clientResult.success || !clientResult.data) {
        setError(clientResult.error || "Client not found")
        return
      }
      setClient(clientResult.data)

      // Extract projects from the client data if available
      if (clientResult.data.projects) {
        setProjects(
          clientResult.data.projects.map((p: { id: string; name: string; status: string }) => ({
            id: p.id,
            name: p.name,
            status: p.status,
          }))
        )
      }
    } catch (err) {
      console.error("Error loading client:", err)
      setError("Failed to load client details")
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
            Active
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
            Completed
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
            On Hold
          </Badge>
        )
      case "not_started":
        return (
          <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
            Not Started
          </Badge>
        )
      default:
        return null
    }
  }

  const handleCall = () => {
    if (client?.phone) {
      window.location.href = `tel:${client.phone}`
    }
  }

  const handleText = () => {
    if (client?.phone) {
      window.location.href = `sms:${client.phone}`
    }
  }

  const handleEmail = () => {
    if (client?.email) {
      window.location.href = `mailto:${client.email}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading client...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
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
              Client Details
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 mb-4">{error || "Client not found"}</p>
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

  // Count active vs completed projects
  const activeProjects = projects.filter((p) => p.status === "in_progress").length
  const completedProjects = projects.filter((p) => p.status === "completed").length

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
            {client.name}
          </h1>
          <button
            onClick={() => {
              // Placeholder for edit functionality
            }}
            className="p-2 -mr-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Edit client"
          >
            <Edit2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Client Profile Header */}
      <div className="bg-white px-5 py-6 border-b border-gray-100">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarFallback className="text-2xl bg-[#2596be] text-white font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
          {client.company && (
            <p className="text-sm text-gray-500 mt-0.5">{client.company}</p>
          )}
          {client.contact_person && !client.company && (
            <p className="text-sm text-gray-500 mt-0.5">{client.contact_person}</p>
          )}
        </div>

        {/* Quick Actions */}
        {(client.phone || client.email) && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {client.phone && (
              <button
                onClick={handleCall}
                className="flex flex-col items-center justify-center gap-1 h-16 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Call</span>
              </button>
            )}
            {client.phone && (
              <button
                onClick={handleText}
                className="flex flex-col items-center justify-center gap-1 h-16 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">Text</span>
              </button>
            )}
            {client.email && (
              <button
                onClick={handleEmail}
                className="flex flex-col items-center justify-center gap-1 h-16 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs">Email</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Project Stats */}
      <div className="px-5 pt-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Project Summary
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeProjects}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{completedProjects}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-5 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Contact Information
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {client.phone && (
            <div className="p-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{client.phone}</p>
              </div>
            </div>
          )}
          {client.email && (
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{client.email}</p>
              </div>
            </div>
          )}
          {client.company && (
            <div className="p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm font-medium text-gray-900">{client.company}</p>
              </div>
            </div>
          )}
          {client.contact_person && client.company && (
            <div className="p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Contact Person</p>
                <p className="text-sm font-medium text-gray-900">
                  {client.contact_person}
                </p>
              </div>
            </div>
          )}
          {!client.phone && !client.email && !client.company && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">No contact information available</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Projects
          </h3>
          <span className="text-xs text-gray-400">{projects.length} total</span>
        </div>
        {projects.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {projects.slice(0, 10).map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="w-full p-4 flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-[#2596be]/10 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-[#2596be]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {project.name}
                  </p>
                  <div className="mt-0.5">{getStatusBadge(project.status)}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
            {projects.length > 10 && (
              <div className="p-4 text-center">
                <p className="text-sm text-[#2596be] font-medium">
                  +{projects.length - 10} more projects
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <FolderKanban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No projects yet</p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
