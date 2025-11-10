"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Users, 
  Clock, 
  FolderKanban, 
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  paths: string[] // Array of paths that should make this nav item active
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Dashboard",
    paths: ["/dashboard"]
  },
  {
    href: "/dashboard/workers",
    icon: Users,
    label: "Workers",
    paths: ["/dashboard/workers"]
  },
  {
    href: "/dashboard/timesheets",
    icon: Clock,
    label: "Time",
    paths: ["/dashboard/timesheets", "/dashboard/time-logs", "/dashboard/approvals"]
  },
  {
    href: "/dashboard/projects",
    icon: FolderKanban,
    label: "Projects",
    paths: ["/dashboard/projects", "/dashboard/clients"]
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
    paths: ["/dashboard/settings"]
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    // Exact match for dashboard
    if (item.href === "/dashboard") {
      return pathname === "/dashboard"
    }
    // Check if current path starts with any of the item's paths
    return item.paths.some(path => pathname.startsWith(path))
  }

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#2596be'
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 safe-bottom max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center p-3 rounded-lg transition-all duration-200 flex-1 mx-1",
                active
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              )}
              aria-label={item.label}
            >
              <Icon className={cn(
                "h-6 w-6 shrink-0 transition-colors",
                active ? "text-white" : "text-white/70"
              )} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

