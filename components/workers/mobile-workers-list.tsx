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
  Plus,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { fetchWorkersForCompany } from "@/lib/data/data"
import { createWorker } from "@/lib/data/workers"
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

  // Add Worker form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [workerName, setWorkerName] = useState("")
  const [workerPhone, setWorkerPhone] = useState("")
  const [workerNotes, setWorkerNotes] = useState("")

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

  const handleCloseAddForm = () => {
    setShowAddForm(false)
    setWorkerName("")
    setWorkerPhone("")
    setWorkerNotes("")
  }

  const handleCreateWorker = async () => {
    if (!workerName.trim()) {
      toast.error("Worker name is required")
      return
    }

    setFormLoading(true)
    try {
      // Note: Workers added via mobile get default values for required fields
      // Position and hourly_rate can be updated later from the desktop view
      const result = await createWorker(userId, {
        name: workerName.trim(),
        phone: workerPhone.trim() || undefined,
        notes: workerNotes.trim() || undefined,
        position: "Worker", // Default position
        hourly_rate: 0, // Default rate - to be set later
        hire_date: new Date().toISOString().split("T")[0],
        is_active: true,
      })

      if (result.success) {
        toast.success("Worker added")
        handleCloseAddForm()
        await loadWorkers()
      } else {
        toast.error(result.error || "Failed to add worker")
      }
    } catch (error) {
      console.error("Error creating worker:", error)
      toast.error("Failed to add worker")
    } finally {
      setFormLoading(false)
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
                : "Tap the button below to add your first worker"}
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

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#2596be] text-white rounded-full shadow-lg flex items-center justify-center active:bg-[#1e7a9a] transition-colors z-50"
        aria-label="Add worker"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Worker Bottom Sheet */}
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
              Add Worker
            </h2>

            {/* Worker Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Worker Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter worker name"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="h-12 text-base rounded-xl"
                autoFocus
              />
            </div>

            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter phone number (optional)"
                value={workerPhone}
                onChange={(e) => setWorkerPhone(e.target.value)}
                className="h-12 text-base rounded-xl"
              />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                placeholder="Enter notes (optional)"
                value={workerNotes}
                onChange={(e) => setWorkerNotes(e.target.value)}
                className="w-full h-24 p-3 border border-gray-200 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-transparent"
              />
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
                onClick={handleCreateWorker}
                disabled={formLoading || !workerName.trim()}
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
