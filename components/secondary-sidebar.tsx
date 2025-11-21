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
  CreditCard,
  Building,
  Settings,
  Receipt,
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Auto-detect section from pathname, default to "track" if no match
    if (pathname.includes("/timesheets") || pathname.includes("/time-logs")) {
      setCurrentSection("track")
    } else if (pathname.includes("/reports") || pathname.includes("/approvals")) {
      setCurrentSection("analyze")
    } else if (pathname.includes("/payroll") || pathname.includes("/projects") || pathname.includes("/clients") || pathname.includes("/workers") || pathname.includes("/invoices")) {
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
        { title: "Invoices", href: "/dashboard/invoices", icon: Receipt },
      ],
    },
  }

  const content = currentSection ? sectionContent[currentSection] : null

  if (!mounted) {
    return (
      <div className={cn(
        "flex h-screen flex-col backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-52"
      )}>
        <div className="flex h-16 shrink-0 flex-col justify-center px-6">
          <h2 className="text-lg">
            <span className="font-extrabold text-[#2596be]">Tropi</span>
            <span className="font-medium text-[#145369]">Track</span>
          </h2>
          <p className="text-xs font-semibold text-gray-500">{profile.company?.name || "Company"}</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div 
        className={cn(
          "flex h-screen flex-col backdrop-blur-xl transition-all duration-300",
          isCollapsed ? "w-0 overflow-hidden" : "w-52"
        )}
        style={{ 
          backgroundColor: theme === 'dark' ? '#0E141A' : 'rgb(240 243 246 / 0.95)',
          borderRightWidth: theme === 'dark' ? '1px' : '1px',
          borderRightStyle: 'solid',
          borderRightColor: theme === 'dark' ? '#1E2A38' : 'rgb(218 228 235 / 0.6)'
        }}
      >
        <div className="flex h-16 shrink-0 flex-col justify-center px-6">
          <h2 className="text-lg">
            <span className="font-extrabold text-[#2596be]">Tropi</span>
            <span className={cn(
              "font-medium",
              theme === 'dark' ? 'text-[#2596be]' : 'text-[#145369]'
            )}>Track</span>
          </h2>
          <p className={cn(
            "text-xs font-semibold",
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
        backgroundColor: theme === 'dark' ? '#0E141A' : 'rgb(240 243 246 / 0.95)',
        borderRightWidth: theme === 'dark' ? '1px' : '1px',
        borderRightStyle: 'solid',
        borderRightColor: theme === 'dark' ? '#1E2A38' : 'rgb(218 228 235 / 0.6)'
      }}
    >
      {/* Section Header */}
      <div className="flex h-16 shrink-0 flex-col justify-center px-6">
        <h2 className="text-lg">
          <span className="font-extrabold text-[#2596be]">Tropi</span>
          <span className={cn(
            "font-medium",
            theme === 'dark' ? 'text-[#2596be]' : 'text-[#145369]'
          )}>Track</span>
        </h2>
        <p className={cn(
          "text-xs font-semibold",
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
                "px-2 text-xs font-semibold uppercase tracking-wider",
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
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                        isActive
                          ? theme === 'dark'
                            ? "text-gray-100 font-medium"
                            : "text-gray-800 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400"
                            : "text-gray-600"
                      )}
                      style={isActive ? {
                        backgroundColor: theme === 'dark' 
                          ? 'rgba(37, 150, 190, 0.18)' 
                          : 'rgba(37, 150, 190, 0.12)'
                      } : undefined}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(37, 150, 190, 0.06)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {Icon && <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive && "text-[#2596be]"
                      )} />}
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
                "px-2 text-xs font-semibold uppercase tracking-wider",
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
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                        isActive
                          ? theme === 'dark'
                            ? "text-gray-100 font-medium"
                            : "text-gray-800 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400"
                            : "text-gray-600"
                      )}
                      style={isActive ? {
                        backgroundColor: theme === 'dark' 
                          ? 'rgba(37, 150, 190, 0.18)' 
                          : 'rgba(37, 150, 190, 0.12)'
                      } : undefined}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(37, 150, 190, 0.06)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {Icon && <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive && "text-[#2596be]"
                      )} />}
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
                "px-2 text-xs font-semibold uppercase tracking-wider",
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
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                        isActive
                          ? theme === 'dark'
                            ? "text-gray-100 font-medium"
                            : "text-gray-800 font-medium"
                          : theme === 'dark'
                            ? "text-gray-400"
                            : "text-gray-600"
                      )}
                      style={isActive ? {
                        backgroundColor: theme === 'dark' 
                          ? 'rgba(37, 150, 190, 0.18)' 
                          : 'rgba(37, 150, 190, 0.12)'
                      } : undefined}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = theme === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(37, 150, 190, 0.06)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {Icon && <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive && "text-[#2596be]"
                      )} />}
                      <span className="flex-1">{link.title}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Admin Footer Section */}
      {profile.role === 'admin' && (
        <div className="border-t p-4" style={{ 
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
        }}>
          <h3 className={cn(
            "px-2 text-xs font-medium uppercase tracking-wider mb-3",
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          )}>
            Admin
          </h3>
          <nav className="space-y-0.5">
            <a
              href="/dashboard/subscription"
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription")
                  ? theme === 'dark'
                    ? "text-gray-100"
                    : "text-gray-800"
                  : theme === 'dark'
                    ? "text-gray-400"
                    : "text-gray-600"
              )}
              style={(pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription")) ? {
                backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.18)' : 'rgba(37, 150, 190, 0.12)'
              } : undefined}
              onMouseEnter={(e) => {
                if (!(pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription"))) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(37, 150, 190, 0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!(pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription"))) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <CreditCard className={cn(
                "h-4 w-4 transition-colors",
                (pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription")) && "text-[#2596be]"
              )} />
              <span className="flex-1">Subscription</span>
            </a>
            <a
              href="/dashboard/organization"
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                pathname === "/dashboard/organization" || pathname.startsWith("/dashboard/organization")
                  ? theme === 'dark'
                    ? "text-gray-100"
                    : "text-gray-800"
                  : theme === 'dark'
                    ? "text-gray-400"
                    : "text-gray-600"
              )}
              style={(pathname === "/dashboard/organization" || pathname.startsWith("/dashboard/organization")) ? {
                backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.18)' : 'rgba(37, 150, 190, 0.12)'
              } : undefined}
              onMouseEnter={(e) => {
                if (!(pathname === "/dashboard/organization" || pathname.startsWith("/dashboard/organization"))) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(37, 150, 190, 0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!(pathname === "/dashboard/organization" || pathname.startsWith("/dashboard/organization"))) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <Building className={cn(
                "h-4 w-4 transition-colors",
                (pathname === "/dashboard/organization" || pathname.startsWith("/dashboard/organization")) && "text-[#2596be]"
              )} />
              <span className="flex-1">Organization</span>
            </a>
            <a
              href="/dashboard/settings"
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative z-10",
                pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings")
                  ? theme === 'dark'
                    ? "text-gray-100"
                    : "text-gray-800"
                  : theme === 'dark'
                    ? "text-gray-400"
                    : "text-gray-600"
              )}
              style={(pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings")) ? {
                backgroundColor: theme === 'dark' ? 'rgba(37, 150, 190, 0.18)' : 'rgba(37, 150, 190, 0.12)'
              } : undefined}
              onMouseEnter={(e) => {
                if (!(pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings"))) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(37, 150, 190, 0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!(pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings"))) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <Settings className={cn(
                "h-4 w-4 transition-colors",
                (pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings")) && "text-[#2596be]"
              )} />
              <span className="flex-1">Settings</span>
            </a>
          </nav>
        </div>
      )}
    </div>
  )
}

