"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { 
  Clock,
  BarChart3,
  ClipboardCheck,
  DollarSign,
  FolderKanban,
  Building2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { UserProfileWithCompany } from "@/lib/types/userProfile"

interface SecondarySidebarProps {
  profile: UserProfileWithCompany
  section?: string | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface QuickAction {
  title: string
  icon: React.ElementType
  href: string
}

interface SectionContent {
  title: string
  quickActions?: QuickAction[]
  links?: Array<{ title: string; href: string; icon?: React.ElementType }>
  showRecent?: boolean
}

export function SecondarySidebar({ section, isCollapsed = false }: SecondarySidebarProps) {
  const pathname = usePathname()
  const [currentSection, setCurrentSection] = useState<string | null>(section || "track")

  useEffect(() => {
    // Auto-detect section from pathname, default to "track" if no match
    if (pathname.includes("/timesheets") || pathname.includes("/time-logs")) {
      setCurrentSection("track")
    } else if (pathname.includes("/reports") || pathname.includes("/approvals")) {
      setCurrentSection("analyze")
    } else if (pathname.includes("/payroll") || pathname.includes("/projects") || pathname.includes("/clients") || pathname.includes("/workers")) {
      setCurrentSection("manage")
    } else {
      setCurrentSection("track") // Default to track section
    }
  }, [pathname])

  const sectionContent: Record<string, SectionContent> = {
    track: {
      title: "Track",
      links: [
        { title: "Time", href: "/dashboard/timesheets", icon: Clock },
      ],
    },
    analyze: {
      title: "Analyze",
      links: [
        { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
        { title: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
      ],
    },
    manage: {
      title: "Manage",
      links: [
        { title: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
        { title: "Projects", href: "/dashboard/projects", icon: FolderKanban },
        { title: "Clients", href: "/dashboard/clients", icon: Building2 },
        { title: "Members", href: "/dashboard/workers", icon: Users },
      ],
    },
  }

  const content = currentSection ? sectionContent[currentSection] : null

  if (!content) {
    return (
      <div className={cn(
        "flex h-screen flex-col border-r border-sidebar-border/50 bg-gray-50/98 backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-52"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <h2 className="text-lg font-semibold">TropiTrack</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-sm text-gray-500">Select a section to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-screen flex-col border-r border-sidebar-border/50 bg-gray-50/98 backdrop-blur-xl transition-all duration-300",
      isCollapsed ? "w-0 overflow-hidden" : "w-52"
    )}>
      {/* Section Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <h2 className="text-lg font-semibold">TropiTrack</h2>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Track Section */}
          {sectionContent.track && (
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {sectionContent.track.title}
              </h3>
              <nav className="space-y-0.5">
                {sectionContent.track.links?.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "?")
                  
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-gray-700 font-medium"
                          : "text-gray-600 hover:bg-sidebar-accent/50 hover:text-gray-900"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="flex-1">{link.title}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Analyze Section */}
          {sectionContent.analyze && (
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {sectionContent.analyze.title}
              </h3>
              <nav className="space-y-0.5">
                {sectionContent.analyze.links?.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "?")
                  
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-gray-700 font-medium"
                          : "text-gray-600 hover:bg-sidebar-accent/50 hover:text-gray-900"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="flex-1">{link.title}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Manage Section */}
          {sectionContent.manage && (
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {sectionContent.manage.title}
              </h3>
              <nav className="space-y-0.5">
                {sectionContent.manage.links?.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "?")
                  
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-gray-700 font-medium"
                          : "text-gray-600 hover:bg-sidebar-accent/50 hover:text-gray-900"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="flex-1">{link.title}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

