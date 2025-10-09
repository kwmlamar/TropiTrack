"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import Link from "next/link"
import type { UserProfileWithCompany } from "@/lib/types/userProfile"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  description?: string
  section?: string
}

const navItems: NavItem[] = []

interface PrimarySidebarProps {
  onSectionChange?: (section: string | null) => void
  isSecondarySidebarCollapsed?: boolean
  onToggleSecondarySidebar?: () => void
  profile: UserProfileWithCompany
}

export function PrimarySidebar({ onSectionChange, isSecondarySidebarCollapsed = false, onToggleSecondarySidebar, profile }: PrimarySidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isActive = (item: NavItem) => {
    // Check if current pathname matches this section
    if (item.section === "dashboard") {
      return pathname === "/dashboard"
    }
    if (item.section === "time") {
      return pathname.includes("/timesheets") || pathname.includes("/time-logs") || pathname.includes("/approvals")
    }
    if (item.section === "finance") {
      return pathname.includes("/payroll") || pathname.includes("/accounting")
    }
    if (item.section === "projects") {
      return pathname.includes("/projects")
    }
    if (item.section === "people") {
      return pathname.includes("/workers") || pathname.includes("/clients")
    }
    if (item.section === "reports") {
      return pathname.includes("/reports")
    }
    return false
  }

  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault()
    if (onSectionChange) {
      onSectionChange(item.section || null)
    }
  }

  const handleSignOut = async () => {
    try {
      const res = await fetch("/auth/signout", {
        method: "POST",
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/login";
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen w-16 flex-col border-r border-sidebar-border/50 bg-gray-100/95 backdrop-blur-xl">
        {/* Logo/Brand */}
        <div className="flex h-16 shrink-0 items-center justify-center">
          <a href="/dashboard" className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <span className="text-xl font-bold text-primary">T</span>
            </div>
          </a>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon

            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleItemClick(item, e)}
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-gray-500 hover:bg-sidebar-accent/50 hover:text-gray-700"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {active && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    {hoveredItem === item.title && !active && (
                      <ChevronRight className="absolute -right-1 h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col gap-1">
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="text-xs text-gray-500">{item.description}</span>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Collapse/Expand Secondary Sidebar Button - Centered */}
        <div className="flex shrink-0 items-center justify-center py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSecondarySidebar || (() => {})}
                className="flex h-12 w-12 items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {isSecondarySidebarCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="font-medium">
                {isSecondarySidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Avatar at bottom */}
        <div className="shrink-0 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 text-gray-500 hover:bg-sidebar-accent/50 hover:text-gray-700">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={profile.name}
                  />
                  <AvatarFallback className="bg-sidebar-primary/10 text-gray-500 text-sm font-medium">
                    {profile.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/account">
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/company">
                  Company Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  )
}


