"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { CompanySetupDialog } from "@/components/company-setup-dialog"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { DateRangeProvider } from "@/context/date-range-context"
import { OnboardingProvider } from "@/context/onboarding-context"

import { CompanySetupOverlayProvider } from "@/components/onboarding/company-setup-overlay-provider"
import { SetupGuideDropdown } from "@/components/onboarding/setup-guide-dropdown"


type DashboardLayoutClientProps = {
  children: React.ReactNode
  title: string
  profile: UserProfileWithCompany
}

export function DashboardLayoutClient({ children, title, profile }: DashboardLayoutClientProps) {
  // Determine if this is the dashboard overview page
  const isDashboard = title === "Dashboard";
  // Determine if this is the timesheets, approvals, or time logs page
  const isTimesheets = title === "Timesheets";
  const isApprovals = title === "Approvals";
  const isTimeLogs = title === "Time Logs";
  const showTimesheetsDropdown = isTimesheets || isApprovals || isTimeLogs;



  return (
    <OnboardingProvider>
      <DateRangeProvider>
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
              hideDateRangePicker={isDashboard} 
              showTimesheetsDropdown={showTimesheetsDropdown}
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
          </SidebarInset>
          
          {/* Company Setup Dialog */}
          <CompanySetupDialog />
          
          {/* Company Setup Overlay - Rendered at top level to cover entire viewport */}
          <CompanySetupOverlayProvider />
          
          {/* Setup Guide Dropdown */}
          <SetupGuideDropdown />
        </SidebarProvider>
      </DateRangeProvider>
    </OnboardingProvider>
  )
} 