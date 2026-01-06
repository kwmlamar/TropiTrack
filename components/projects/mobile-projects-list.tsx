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
} from "lucide-react"
import { fetchProjectsForCompany } from "@/lib/data/data"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

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

interface MobileProjectsListProps {
  userId: string
}

export function MobileProjectsList({ userId }: MobileProjectsListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

      {/* Floating Add Button */}
      <button
        onClick={() => router.push("/dashboard/projects/new")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#2596be] text-white rounded-full shadow-lg flex items-center justify-center active:bg-[#1e7a9a] transition-colors z-50"
        aria-label="Add project"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
