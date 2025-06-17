"use client"

import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

type ViewMode = "daily" | "weekly" | "monthly"

export function DashboardHeader() {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your construction operations.</p>
      </div>

      <div className="flex items-center gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-border/50 bg-card/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "daily" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setViewMode("daily")}
          >
            Daily
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "weekly" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setViewMode("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              viewMode === "monthly" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
