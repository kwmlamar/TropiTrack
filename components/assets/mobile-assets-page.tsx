"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  Clock,
  DollarSign,
  FolderKanban,
  Building2,
  HardHat,
  ChevronRight,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

interface AssetItem {
  label: string
  icon: React.ElementType
  route: string
  description: string
}

interface AssetSection {
  title: string
  items: AssetItem[]
}

/**
 * Mobile Assets Page Component (Connecteam-inspired)
 *
 * A mobile-first assets page that provides quick access to various
 * organizational resources and features. Organized into clear sections
 * with card-based navigation buttons.
 *
 * Layout:
 * - Sticky Header: Page title "Assets" with search bar
 * - Communication Section: Directory access
 * - Operations Section: Time Clock, Payroll, Projects, Workers, Clients
 * - Bottom Navigation: Fixed mobile nav bar
 */
export function MobileAssetsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Asset button configuration organized by section
  const assetSections: AssetSection[] = [
    {
      title: "Communication",
      items: [
        {
          label: "Directory",
          icon: Users,
          route: "/dashboard/workers",
          description: "Team contacts & profiles",
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Time Clock",
          icon: Clock,
          route: "/dashboard/timesheets",
          description: "Track hours & attendance",
        },
        {
          label: "Payroll",
          icon: DollarSign,
          route: "/dashboard/payroll",
          description: "Manage payments",
        },
        {
          label: "Projects",
          icon: FolderKanban,
          route: "/dashboard/projects",
          description: "Active job sites",
        },
        {
          label: "Workers",
          icon: HardHat,
          route: "/dashboard/workers",
          description: "Manage team members",
        },
        {
          label: "Clients",
          icon: Building2,
          route: "/dashboard/clients",
          description: "Customer accounts",
        },
      ],
    },
  ]

  // Filter assets based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return assetSections

    const query = searchQuery.toLowerCase()
    return assetSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchQuery])

  const handleAssetClick = (route: string) => {
    router.push(route)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-xl border-gray-200 bg-gray-100 focus:bg-white focus:border-[#2596be] focus:ring-[#2596be]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asset Sections */}
      <div className="px-4 pt-6 space-y-6">
        {filteredSections.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No assets found
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Try adjusting your search
            </p>
            <button
              onClick={clearSearch}
              className="mt-4 text-sm font-medium text-[#2596be] active:text-[#1e7a9a]"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>

              {/* Section Cards */}
              <div className="space-y-3">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={`${section.title}-${item.label}`}
                      onClick={() => handleAssetClick(item.route)}
                      className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 active:bg-gray-50 active:scale-[0.99] transition-all duration-150"
                    >
                      {/* Icon Container */}
                      <div className="flex-shrink-0 w-12 h-12 bg-[#2596be]/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#2596be]" />
                      </div>

                      {/* Label & Description */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-base font-semibold text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {item.description}
                        </p>
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Results count when searching */}
        {searchQuery && filteredSections.length > 0 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} result
            {filteredSections.reduce((acc, s) => acc + s.items.length, 0) !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

