"use client";

import type React from "react";
import { ChevronDown, FileText, CheckCircle, Clock, BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

import { DateRangePicker } from "@/components/date-range-picker";

type SiteHeaderProps = {
  title?: string | React.ReactNode;
  children?: React.ReactNode;
  hideDateRangePicker?: boolean;
  showTimesheetsDropdown?: boolean;
  showReportsTabs?: boolean;
  activeReportTab?: string;
  onReportTabChange?: (tab: string) => void;
};

export function SiteHeader({
  title = "Dashboard",
  children,
  hideDateRangePicker = false,
  showTimesheetsDropdown = false,
  showReportsTabs = false,
  activeReportTab = "summary",
  onReportTabChange,
}: SiteHeaderProps) {
  const { theme } = useTheme();

  return (
    <header 
      className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-all duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#171717' : 'oklch(1 0.003 250)',
        borderBottom: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.4)'
      }}
    >
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left Section - Title */}
        <div className="flex items-center gap-2">
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
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Timesheets
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/approvals">
                  <DropdownMenuItem className="cursor-pointer">
                    <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                    Approvals
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/time-logs">
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    Time Logs
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h1 className="text-lg font-semibold text-foreground">
              {typeof title === 'string' ? title : title}
            </h1>
          )}
        </div>

        {/* Center Section - Date Range Picker or Report Tabs */}
        <div className="flex-1 flex justify-center">
          {showReportsTabs ? (
            <Tabs value={activeReportTab} onValueChange={onReportTabChange} className="w-full max-w-2xl">
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="summary" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent [&[data-state=active]_svg]:text-muted-foreground"
                >
                  <BarChart3 className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="detailed" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent [&[data-state=active]_svg]:text-muted-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  Detailed
                </TabsTrigger>
                <TabsTrigger 
                  value="workload" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent [&[data-state=active]_svg]:text-muted-foreground"
                >
                  <Users className="h-4 w-4" />
                  Workload
                </TabsTrigger>
                <TabsTrigger 
                  value="profitability" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent [&[data-state=active]_svg]:text-muted-foreground"
                >
                  <DollarSign className="h-4 w-4" />
                  Profitability
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            !hideDateRangePicker && <DateRangePicker />
          )}
        </div>

        {/* Right Section - Custom Content */}
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </header>
  );
}
