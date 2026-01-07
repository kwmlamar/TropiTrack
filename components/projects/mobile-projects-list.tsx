"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FolderKanban,
  MapPin,
  Plus,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { fetchProjectsForCompany } from "@/lib/data/data"
import { createProject } from "@/lib/data/projects"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/utils/supabase/client"

interface ProjectWithClient {
  id: string
  name: string
  description?: string
  location?: string
  status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
  client?: {
    id: string
    name: string
  }
}

interface ClientOption {
  id: string
  name: string
}

interface MobileProjectsListProps {
  userId: string
}

export function MobileProjectsList({ userId }: MobileProjectsListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Add Project form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await fetchProjectsForCompany(userId)
      setProjects(data as ProjectWithClient[])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load clients when form opens
  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) return

      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name")
        .eq("company_id", profile.company_id)
        .order("name")

      if (clientsData) {
        setClients(clientsData)
      }
    } catch (error) {
      console.error("Failed to load clients:", error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleOpenAddForm = () => {
    setShowAddForm(true)
    loadClients()
  }

  const handleCloseAddForm = () => {
    setShowAddForm(false)
    setProjectName("")
    setProjectDescription("")
    setSelectedClientId("")
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required")
      return
    }

    setFormLoading(true)
    try {
      // Build project data - client_id is required in the type, so we only include it if selected
      const projectData: Parameters<typeof createProject>[1] = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        client_id: selectedClientId || "", // Empty string if no client - will be handled by backend
        status: "not_started",
        start_date: new Date().toISOString().split("T")[0],
      }

      const result = await createProject(userId, projectData)

      if (result.success) {
        toast.success("Project created")
        handleCloseAddForm()
        await loadProjects()
      } else {
        toast.error(result.error || "Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project")
    } finally {
      setFormLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects

    const query = searchQuery.toLowerCase()
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.client?.name?.toLowerCase().includes(query)
    )
  }, [projects, searchQuery])

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0">
            Active
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-2 py-0">
            Completed
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs px-2 py-0">
            On Hold
          </Badge>
        )
      case "not_started":
        return (
          <Badge className="bg-gray-100 text-gray-600 border-0 text-xs px-2 py-0">
            Not Started
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 border-0 text-xs px-2 py-0">
            Cancelled
          </Badge>
        )
      default:
        return null
    }
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
          <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-xl border-gray-200 bg-gray-100 focus:bg-white focus:border-[#2596be] focus:ring-[#2596be]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {searchQuery
                ? "Try adjusting your search"
                : "Tap the button below to add your first project"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm font-medium text-[#2596be]"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Results count */}
            {searchQuery && (
              <p className="text-xs text-gray-500 px-1">
                {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Project Cards */}
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 active:bg-gray-50 transition-colors text-left"
              >
                {/* Project Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-[#2596be]/10 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-[#2596be]" />
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {project.name}
                    </p>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Client Name */}
                  {project.client?.name && (
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {project.client.name}
                    </p>
                  )}

                  {/* Location */}
                  {project.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button - opens inline form instead of navigating */}
      <button
        onClick={handleOpenAddForm}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#2596be] text-white rounded-full shadow-lg flex items-center justify-center active:bg-[#1e7a9a] transition-colors z-50"
        aria-label="Add project"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Project Bottom Sheet */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseAddForm}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Project
            </h2>

            {/* Project Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-12 text-base rounded-xl"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Enter project description (optional)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full h-24 p-3 border border-gray-200 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent"
              />
            </div>

            {/* Client Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Client
              </label>
              {loadingClients ? (
                <div className="h-12 flex items-center justify-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent bg-white"
                >
                  <option value="">No client (optional)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseAddForm}
                disabled={formLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium text-base active:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={formLoading || !projectName.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-[#2596be] text-white font-medium text-base active:bg-[#1e7a9a] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
