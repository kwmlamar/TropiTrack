"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
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

export function SecondarySidebar({ profile, section, isCollapsed = false }: SecondarySidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
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
        { title: "Workers", href: "/dashboard/workers", icon: Users },
      ],
    },
  }

  const content = currentSection ? sectionContent[currentSection] : null

  if (!content) {
    return (
      <div 
        className={cn(
          "flex h-screen flex-col backdrop-blur-xl transition-all duration-300",
          isCollapsed ? "w-0 overflow-hidden" : "w-52"
        )}
        style={{ 
          backgroundColor: theme === 'dark' ? '#0f0f0f' : 'rgb(243 244 246 / 0.98)',
          borderRight: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.5)'
        }}
      >
        <div className="flex h-16 shrink-0 flex-col justify-center px-6">
          <h2 className={cn(
            "text-lg font-semibold",
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          )}>TropiTrack</h2>
          <p className={cn(
            "text-xs",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>{profile.company?.name || "Company"}</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className={cn(
            "text-center text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>Select a section to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "flex h-screen flex-col backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-52"
      )}
      style={{ 
        backgroundColor: theme === 'dark' ? '#0f0f0f' : 'rgb(243 244 246 / 0.98)',
        borderRight: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.5)'
      }}
    >
      {/* Section Header */}
      <div className="flex h-16 shrink-0 flex-col justify-center px-6">
        <h2 className={cn(
          "text-lg font-semibold",
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        )}>TropiTrack</h2>
        <p className={cn(
          "text-xs",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>{profile.company?.name || "Company"}</p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Track Section */}
          {sectionContent.track && (
            <div className="space-y-2">
              <h3 className={cn(
                "px-2 text-xs font-medium uppercase tracking-wider",
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              )}>
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
                          ? theme === 'dark'
                            ? "bg-primary/20 text-gray-100 font-medium"
                            : "bg-primary/10 text-gray-700 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
              <h3 className={cn(
                "px-2 text-xs font-medium uppercase tracking-wider",
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              )}>
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
                          ? theme === 'dark'
                            ? "bg-primary/20 text-gray-100 font-medium"
                            : "bg-primary/10 text-gray-700 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
              <h3 className={cn(
                "px-2 text-xs font-medium uppercase tracking-wider",
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              )}>
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
                          ? theme === 'dark'
                            ? "bg-primary/20 text-gray-100 font-medium"
                            : "bg-primary/10 text-gray-700 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
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

