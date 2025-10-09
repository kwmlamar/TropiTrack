"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { SiteHeader } from "@/components/site-header"
import { PrimarySidebar } from "@/components/primary-sidebar"
import { SecondarySidebar } from "@/components/secondary-sidebar"

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
  fullWidth?: boolean
  headerActions?: React.ReactNode
}

export function DashboardLayoutClient({ children, title, profile, fullWidth = false, headerActions }: DashboardLayoutClientProps) {
  const { theme } = useTheme()
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isSecondarySidebarCollapsed, setIsSecondarySidebarCollapsed] = useState(false)
  
  // Determine if this is the approvals, time logs, or reports page
  const isApprovals = title === "Approvals";
  const isTimeLogs = title === "Time Logs";
  const isReports = title === "Reports";
  const showTimesheetsDropdown = isApprovals || isTimeLogs;
  // Don't show date range picker on any pages now (handled in page-specific headers)
  const showDateRangePicker = false;
  // Show report tabs only on reports page
  const showReportsTabs = isReports;

  const layoutContent = (
    <div className="flex h-screen overflow-hidden">
      {/* Primary Sidebar - Icon based */}
      <PrimarySidebar 
        onSectionChange={setSelectedSection}
        isSecondarySidebarCollapsed={isSecondarySidebarCollapsed}
        onToggleSecondarySidebar={() => setIsSecondarySidebarCollapsed(!isSecondarySidebarCollapsed)}
        profile={profile}
      />
      
      {/* Secondary Sidebar - Contextual */}
      <SecondarySidebar 
        profile={profile} 
        section={selectedSection}
        isCollapsed={isSecondarySidebarCollapsed}
        onToggleCollapse={() => setIsSecondarySidebarCollapsed(!isSecondarySidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {isReports ? (
          <ReportsHeaderWrapper title={title} />
        ) : (
          <SiteHeader 
            title={title} 
            hideDateRangePicker={!showDateRangePicker} 
            showTimesheetsDropdown={showTimesheetsDropdown}
            showReportsTabs={showReportsTabs}
          >
            {headerActions}
          </SiteHeader>
        )}
        
        {/* Page Content */}
        <main 
          className="flex-1 overflow-auto"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff'
          }}
        >
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className={fullWidth ? "" : "px-4 lg:px-6"}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Setup Guide Dropdown - Lazy Loaded */}
      <LazySetupGuide />
      
      {/* Onboarding Check - Shows company setup overlay when needed */}
      <OnboardingCheck />
    </div>
  )

  return (
    <OnboardingProvider>
      <DateRangeProvider>
        {isReports ? (
          <ReportsTabsProvider>
            {layoutContent}
          </ReportsTabsProvider>
        ) : (
          layoutContent
        )}
      </DateRangeProvider>
    </OnboardingProvider>
  )
} 