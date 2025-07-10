"use client";

import type React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { DateRangePicker } from "@/components/date-range-picker";

type SiteHeaderProps = {
  title?: string;
  children?: React.ReactNode;
};

export function SiteHeader({
  title = "Dashboard",
  children,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-sidebar transition-all duration-300">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left Section - Sidebar Trigger & Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 hover:bg-muted/80 transition-colors duration-200" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        {/* Center Section - Date Range Picker */}
        <div className="flex-1 flex justify-center">
          <DateRangePicker />
        </div>

        {/* Right Section - Custom Content */}
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </header>
  );
}
