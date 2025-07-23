"use client"

import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface NavSecondaryItem {
  title: string
  url: string
  icon: LucideIcon
  shortcut?: string
  description?: string
}

interface NavSecondaryProps {
  items: NavSecondaryItem[]
  className?: string
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarMenu className={cn("space-y-1", className)}>
        {items.map((item) => {
          const isActive = pathname === item.url

          const menuButton = (
            <SidebarMenuButton
              asChild
              className={cn(
                "group h-9 px-3 transition-all duration-200 hover:bg-sidebar-accent/50",
                "data-[slot=sidebar-menu-button]:justify-start",
                isActive && "bg-sidebar-accent/70 text-sidebar-accent-foreground",
              )}
            >
              <a href={item.url} className="flex items-center gap-3 w-full">
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors duration-200",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm truncate">{item.title}</span>
                    {item.shortcut && (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-xs bg-transparent border-sidebar-foreground/20 text-sidebar-foreground/60"
                      >
                        {item.shortcut}
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
                    {item.shortcut && (
                      <Badge variant="outline" className="w-fit text-xs">
                        {item.shortcut}
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
