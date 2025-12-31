"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  LayoutGrid, 
  User, 
  Shield
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
    label: "Feed",
    paths: ["/dashboard"]
  },
  {
    href: "/dashboard/projects",
    icon: LayoutGrid,
    label: "Assets",
    paths: ["/dashboard/projects", "/dashboard/clients"]
  },
  {
    href: "/dashboard/profile",
    icon: User,
    label: "Profile",
    paths: ["/dashboard/profile"]
  },
  {
    href: "/dashboard/admin",
    icon: Shield,
    label: "Admin",
    paths: ["/dashboard/admin", "/dashboard/settings"]
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="flex items-center justify-between h-20 px-4 safe-bottom max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 flex-1 mx-1",
                active
                  ? "bg-gray-100"
                  : "hover:bg-gray-50"
              )}
              aria-label={item.label}
            >
              <Icon className={cn(
                "h-6 w-6 shrink-0 transition-colors mb-1",
                active ? "text-[#2596be]" : "text-gray-500"
              )} />
              <span className={cn(
                "text-xs font-medium transition-colors",
                active ? "text-[#2596be]" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

