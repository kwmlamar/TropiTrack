"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  icon: LucideIcon
  action: string
}

interface QuickActionsProps {
  items: QuickAction[]
  onAction: (action: string) => void
}

export function QuickActions({ items, onAction }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <Button
          key={item.action}
          variant="ghost"
          size="sm"
          onClick={() => onAction(item.action)}
          className={cn(
            "h-auto p-3 flex flex-col items-center gap-2 text-xs",
            "hover:bg-sidebar-accent/70 transition-all duration-200",
            "border border-sidebar-border/50 hover:border-sidebar-border",
          )}
        >
          <item.icon className="h-4 w-4 text-sidebar-foreground/70" />
          <span className="text-sidebar-foreground/80 font-medium leading-tight text-center">
            {item.title}
          </span>
        </Button>
      ))}
    </div>
  )
}
