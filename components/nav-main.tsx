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
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/")

          const menuButton = (
            <SidebarMenuButton
              asChild
              className={cn(
                "group relative h-10 px-3 transition-all duration-200 hover:bg-sidebar-accent/70",
                "data-[slot=sidebar-menu-button]:justify-start",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm",
                isActive &&
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-sidebar-primary before:rounded-r-full",
              )}
            >
              <a href={item.url} className="flex items-center gap-3 w-full">
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors duration-200",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
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
                    {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
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
    </TooltipProvider>
  )
}
