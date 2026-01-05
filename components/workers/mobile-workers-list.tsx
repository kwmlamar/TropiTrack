"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react"
import { fetchWorkersForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

interface MobileWorkersListProps {
  userId: string
}

export function MobileWorkersList({ userId }: MobileWorkersListProps) {
  const router = useRouter()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadWorkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadWorkers = async () => {
    setLoading(true)
    try {
      const data = await fetchWorkersForCompany(userId, { includeInactive: false })
      setWorkers(data)
    } catch (error) {
      console.error("Failed to fetch workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers

    const query = searchQuery.toLowerCase()
    return workers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(query) ||
        worker.position?.toLowerCase().includes(query) ||
        worker.email?.toLowerCase().includes(query)
    )
  }, [workers, searchQuery])

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleWorkerClick = (workerId: string) => {
    router.push(`/dashboard/workers/${workerId}`)
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
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
            Workers
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workers..."
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

      {/* Workers List */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-4">Loading workers...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No workers found" : "No workers yet"}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {searchQuery
                ? "Try adjusting your search"
                : "Add workers from the desktop dashboard"}
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
                {filteredWorkers.length} result{filteredWorkers.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Worker Cards */}
            {filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                onClick={() => handleWorkerClick(worker.id)}
                className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 active:bg-gray-50 transition-colors"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-[#2596be] text-white text-sm font-semibold">
                    {getInitials(worker.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {worker.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500 truncate">
                      {worker.position || "Worker"}
                    </p>
                    <span className="text-gray-300">·</span>
                    <Badge
                      className={
                        worker.is_active
                          ? "bg-green-100 text-green-700 border-0 text-xs px-2 py-0"
                          : "bg-gray-100 text-gray-600 border-0 text-xs px-2 py-0"
                      }
                    >
                      {worker.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
