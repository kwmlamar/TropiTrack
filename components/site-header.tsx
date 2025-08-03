"use client";

import type React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { DateRangePicker } from "@/components/date-range-picker";
import { CompanyDropdown } from "@/components/company-dropdown";

type SiteHeaderProps = {
  title?: string;
  children?: React.ReactNode;
  hideDateRangePicker?: boolean;
  showTimesheetsDropdown?: boolean;
};

export function SiteHeader({
  title = "Dashboard",
  children,
  hideDateRangePicker = false,
  showTimesheetsDropdown = false,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-sidebar transition-all duration-300">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left Section - Sidebar Trigger & Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 hover:bg-muted/80 transition-colors duration-200" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          {showTimesheetsDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="truncate max-w-[120px]">{title}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <Link href="/dashboard/timesheets">
                  <DropdownMenuItem className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4" />
                    Timesheets
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/approvals">
                  <DropdownMenuItem className="cursor-pointer">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approvals
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/time-logs">
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Time Logs
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>

        {/* Center Section - Date Range Picker */}
        <div className="flex-1 flex justify-center">
          {!hideDateRangePicker && <DateRangePicker />}
        </div>

        {/* Right Section - Company Dropdown & Custom Content */}
        <div className="flex items-center gap-2">
          <CompanyDropdown />
          {children}
        </div>
      </div>
    </header>
  );
}
