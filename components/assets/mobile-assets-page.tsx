"use client"

import { useRouter } from "next/navigation"
import {
  Users,
  Clock,
  DollarSign,
  FolderKanban,
  Building2,
  HardHat,
  ChevronRight,
} from "lucide-react"
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
 * - Sticky Header: "Assets" title
 * - Communication Section: Directory access
 * - Operations Section: Time Clock, Payroll, Projects, Workers, Clients
 * - Bottom Navigation: Fixed mobile nav bar
 */
export function MobileAssetsPage() {
  const router = useRouter()

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
          route: "/dashboard/projects?view=list",
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

  const handleAssetClick = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center h-14 px-4">
          <h1 className="text-lg font-semibold text-gray-900">Assets</h1>
        </div>
      </div>

      {/* Asset Sections */}
      <div className="px-4 pt-4 space-y-6">
        {assetSections.map((section) => (
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
        ))}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

