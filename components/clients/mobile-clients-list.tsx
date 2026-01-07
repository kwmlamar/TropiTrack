"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  FolderKanban,
  Phone,
  Plus,
  X,
} from "lucide-react"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { createClient } from "@/utils/supabase/client"

interface ClientWithProjects {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  contact_person?: string
  activeProjectCount?: number
}

export function MobileClientsList() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error("Error getting authenticated user:", authError)
        setLoading(false)
        return
      }

      // Get user's company_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", authUser.id)
        .single()

      if (profileError) {
        console.error("Error getting user profile:", profileError)
        setLoading(false)
        return
      }

      if (!profile?.company_id) {
        console.error("No company found for user")
        setLoading(false)
        return
      }

      // Fetch clients with project counts
      const { data: clientsData, error } = await supabase
        .from("clients")
        .select(`
          *,
          projects(id, status)
        `)
        .eq("company_id", profile.company_id)
        .order("name", { ascending: true })

      if (error) {
        console.error("Error loading clients:", error)
        return
      }

      if (clientsData) {
        // Transform to include active project count
        const clientsWithCounts = clientsData.map((client) => ({
          ...client,
          activeProjectCount: client.projects?.filter(
            (p: { status: string }) => p.status === "in_progress"
          ).length || 0,
        }))
        setClients(clientsWithCounts as ClientWithProjects[])
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.contact_person?.toLowerCase().includes(query)
    )
  }, [clients, searchQuery])

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleClientClick = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
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
          <h1 className="text-lg font-semibold text-gray-900">Clients</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clients..."
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

      {/* Clients List */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No clients found" : "No clients yet"}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {searchQuery
                ? "Try adjusting your search"
                : "Tap the button below to add your first client"}
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
                {filteredClients.length} result{filteredClients.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Client Cards */}
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientClick(client.id)}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-[#2596be] text-white text-sm font-semibold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Client Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {client.name}
                  </p>

                  {/* Company or Contact */}
                  {(client.company || client.contact_person) && (
                    <p className="text-sm text-gray-500 truncate">
                      {client.company || client.contact_person}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-1">
                    {/* Active Projects */}
                    {client.activeProjectCount !== undefined && client.activeProjectCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>{client.activeProjectCount} active project{client.activeProjectCount !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {/* Phone */}
                    {client.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => router.push("/dashboard/clients/new")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#2596be] text-white rounded-full shadow-lg flex items-center justify-center active:bg-[#1e7a9a] transition-colors z-50"
        aria-label="Add client"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
