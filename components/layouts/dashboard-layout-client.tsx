"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"


import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { DateRangeProvider } from "@/context/date-range-context"
import { OnboardingProvider } from "@/context/onboarding-context"
import { ReportsTabsProvider } from "@/context/reports-tabs-context"

import { LazySetupGuide } from "@/components/onboarding/lazy-setup-guide"
import { OnboardingCheck } from "@/components/onboarding/onboarding-check"
import { ReportsHeaderWrapper } from "@/components/reports/reports-header-wrapper"

type DashboardLayoutClientProps = {
  children: React.ReactNode
  title: string | React.ReactNode
  profile: UserProfileWithCompany
}

export function DashboardLayoutClient({ children, title, profile }: DashboardLayoutClientProps) {
  // Determine if this is the timesheets, approvals, or time logs page
  const isTimesheets = title === "Timesheets";
  const isApprovals = title === "Approvals";
  const isTimeLogs = title === "Time Logs";
  const isPayroll = title === "Payroll";
  const isReports = title === "Reports";
  const showTimesheetsDropdown = isTimesheets || isApprovals || isTimeLogs;
  // Show date range picker only on timesheets and payroll pages
  const showDateRangePicker = isTimesheets || isPayroll;
  // Show report tabs only on reports page
  const showReportsTabs = isReports;

  return (
    <OnboardingProvider>
      <DateRangeProvider>
        {isReports ? (
          <ReportsTabsProvider>
            <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 64)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar profile={profile} variant="inset" />
          <SidebarInset>
            {isReports ? (
              <ReportsHeaderWrapper title={title} />
            ) : (
              <SiteHeader 
                title={title} 
                hideDateRangePicker={!showDateRangePicker} 
                showTimesheetsDropdown={showTimesheetsDropdown}
                showReportsTabs={showReportsTabs}
              />
            )}
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="px-4 lg:px-6">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
          
          {/* Setup Guide Dropdown - Lazy Loaded */}
          <LazySetupGuide />
          
          {/* Onboarding Check - Shows company setup overlay when needed */}
          <OnboardingCheck />
        </SidebarProvider>
          </ReportsTabsProvider>
        ) : (
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 64)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar profile={profile} variant="inset" />
            <SidebarInset>
              <SiteHeader 
                title={title} 
                hideDateRangePicker={!showDateRangePicker} 
                showTimesheetsDropdown={showTimesheetsDropdown}
                showReportsTabs={showReportsTabs}
              />
              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <div className="px-4 lg:px-6">
                      {children}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Setup Guide Dropdown - Lazy Loaded */}
              <LazySetupGuide />
              
              {/* Onboarding Check - Shows company setup overlay when needed */}
              <OnboardingCheck />
            </SidebarInset>
          </SidebarProvider>
        )}
      </DateRangeProvider>
    </OnboardingProvider>
  )
} 