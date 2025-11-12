"use client";

import type React from "react";
import { ChevronDown, FileText, CheckCircle, Clock, BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
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
  showSettingsTabs?: boolean;
  activeSettingsTab?: string;
  onSettingsTabChange?: (tab: string) => void;
};

export function SiteHeader({
  title = "Dashboard",
  children,
  hideDateRangePicker = false,
  showTimesheetsDropdown = false,
  showReportsTabs = false,
  activeReportTab = "summary",
  onReportTabChange,
  showSettingsTabs = false,
  activeSettingsTab = "general",
  onSettingsTabChange,
}: SiteHeaderProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine active settings tab from pathname if not provided
  const currentSettingsTab = showSettingsTabs 
    ? (pathname?.includes('/settings/nib') ? 'nib' : 'general')
    : activeSettingsTab;
  
  // Handle settings tab change
  const handleSettingsTabChange = (tab: string) => {
    if (onSettingsTabChange) {
      onSettingsTabChange(tab);
    } else if (showSettingsTabs) {
      // Default navigation behavior
      if (tab === 'nib') {
        router.push('/dashboard/settings/nib');
      } else {
        router.push('/dashboard/settings');
      }
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-all duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#171717' : 'oklch(1 0.003 250)',
        borderBottom: theme === 'dark' ? '1px solid #262626' : '1px solid rgb(226 232 240 / 0.4)'
      }}
    >
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left Section - Title and Settings Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showTimesheetsDropdown ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="truncate max-w-[100px] sm:max-w-[120px]">{title}</span>
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
          
          {/* Settings Tabs - Moved closer to title */}
          {showSettingsTabs && (
            <Tabs value={currentSettingsTab} onValueChange={handleSettingsTabChange} className="w-auto">
              <TabsList className="grid w-auto grid-cols-2 bg-transparent p-0 h-auto gap-1 sm:gap-2">
                <TabsTrigger 
                  value="general" 
                  className="text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="nib" 
                  className="text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none whitespace-nowrap"
                >
                  <span className="hidden sm:inline">NIB Settings</span>
                  <span className="sm:hidden">NIB</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Center Section - Date Range Picker or Report Tabs */}
        <div className="flex-1 flex justify-start min-w-0">
          {showReportsTabs ? (
            <Tabs value={activeReportTab} onValueChange={onReportTabChange} className="w-auto">
              <TabsList className="grid w-auto grid-cols-4 bg-transparent p-0 h-auto gap-1 sm:gap-2">
                <TabsTrigger 
                  value="summary" 
                  className="flex items-center justify-center gap-1 text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none whitespace-nowrap"
                >
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Summary</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="detailed" 
                  className="flex items-center justify-center gap-1 text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none whitespace-nowrap"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Detailed</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="workload" 
                  className="flex items-center justify-center gap-1 text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none whitespace-nowrap"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Workload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="profitability" 
                  className="flex items-center justify-center gap-1 text-xs sm:text-sm bg-white border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A] border rounded-lg px-2 sm:px-3 py-1.5 shadow-none whitespace-nowrap"
                >
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Profitability</span>
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
