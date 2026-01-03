"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Clock, DollarSign, FolderKanban, Building2, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

/**
 * Mobile Assets Page Component
 * 
 * A mobile-first assets page that provides quick access to various
 * organizational resources and features. Organized into clear sections
 * for easy navigation.
 * 
 * Layout:
 * - Header: Page title "Assets" with prominent search bar
 * - Communication Section: Directory access
 * - Operations Section: Time Clock, Payroll
 * - Management Section: Projects, Clients, Workers
 * - Bottom Navigation: Fixed mobile nav bar
 */
export function MobileAssetsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Asset button configuration
  // Organized by section for clear categorization
  const assetSections = [
    {
      title: "Communication",
      items: [
        {
          label: "Directory",
          icon: Users,
          route: "/dashboard/workers",
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
        },
        {
          label: "Payroll",
          icon: DollarSign,
          route: "/dashboard/payroll",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Projects",
          icon: FolderKanban,
          route: "/dashboard/projects",
        },
        {
          label: "Clients",
          icon: Building2,
          route: "/dashboard/clients",
        },
        {
          label: "Workers",
          icon: User,
          route: "/dashboard/workers",
        },
      ],
    },
  ]

  const handleAssetClick = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-28">
      {/* Search Bar - Directly below site header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-3 sm:-mx-4 lg:-mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-[#2596be] rounded-lg"
          />
        </div>
      </div>

      {/* Asset Sections */}
      <div className="px-6 pt-6 space-y-8">
        {assetSections.map((section) => (
          <div key={section.title}>
            {/* Section Header */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {section.title}
            </h2>

            {/* Section Buttons */}
            <div className="space-y-3">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.route}
                    onClick={() => handleAssetClick(item.route)}
                    variant="outline"
                    className="w-full h-16 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm rounded-xl flex items-center justify-start px-6 space-x-4 transition-all active:scale-[0.98]"
                  >
                    {/* Icon Container */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>

                    {/* Label */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-gray-900">
                        {item.label}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

