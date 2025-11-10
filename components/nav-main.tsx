"use client"

import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavMainItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: string | null
  description?: string
}

interface NavMainProps {
  items: NavMainItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2">
        <div className="px-3 py-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Main Menu</h3>
        </div>
        <SidebarMenu className="space-y-0.5">
          {items.map((item) => {
          const isActive = item.url === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname === item.url || pathname.startsWith(item.url + "/") || 
              (item.title === "Time Tracking" && (pathname === "/dashboard/timesheets" || pathname === "/dashboard/time-logs" || pathname === "/dashboard/approvals"))

          const menuButton = (
            <SidebarMenuButton
              asChild
              className={cn(
                "group relative h-10 px-3 transition-all duration-200 rounded-xl",
                "data-[slot=sidebar-menu-button]:justify-start",
                isActive && "font-medium",
              )}
              style={{
                backgroundColor: isActive ? 'rgba(37, 150, 190, 0.15)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 150, 190, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <a href={item.url} className="flex items-center gap-3 w-full">
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors duration-200",
                    isActive
                      ? ""
                      : "text-gray-400 group-hover:text-gray-600",
                  )}
                  style={isActive ? { color: '#2596be' } : undefined}
                />
                {!isCollapsed && (
                  <>
                    <span className={cn(
                      "flex-1 text-sm font-medium truncate",
                      isActive ? "text-sidebar-foreground" : "text-gray-600 group-hover:text-gray-700"
                    )}>{item.title}</span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-xs bg-sidebar-accent-foreground/10 text-sidebar-accent-foreground border-0"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </a>
            </SidebarMenuButton>
          )

          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col gap-1">
                    <span className="font-medium">{item.title}</span>
                    {item.description && <span className="text-xs text-gray-500">{item.description}</span>}
                    {item.badge && (
                      <Badge variant="secondary" className="w-fit">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            )
          }

          return <SidebarMenuItem key={item.title}>{menuButton}</SidebarMenuItem>
        })}
        </SidebarMenu>
      </div>
    </TooltipProvider>
  )
}
