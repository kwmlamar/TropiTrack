"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { SiteHeader } from "@/components/site-header"
import { PrimarySidebar } from "@/components/primary-sidebar"
import { SecondarySidebar } from "@/components/secondary-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { DateRangeProvider } from "@/context/date-range-context"
import { OnboardingProvider } from "@/context/onboarding-context"
import { ReportsTabsProvider } from "@/context/reports-tabs-context"
import { SidebarProvider, useSidebarCollapse } from "@/context/sidebar-context"

import { OnboardingCheck } from "@/components/onboarding/onboarding-check"
import { ReportsHeaderWrapper } from "@/components/reports/reports-header-wrapper"

type DashboardLayoutClientProps = {
  children: React.ReactNode
  title: string | React.ReactNode
  profile: UserProfileWithCompany
  fullWidth?: boolean
  headerActions?: React.ReactNode
  showSettingsTabs?: boolean
  activeSettingsTab?: string
  onSettingsTabChange?: (tab: string) => void
}

export function DashboardLayoutClient({ children, title, profile, fullWidth = false, headerActions, showSettingsTabs = false, activeSettingsTab = "general", onSettingsTabChange }: DashboardLayoutClientProps) {
  const { theme } = useTheme()
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  
  // Determine if this is the time logs or reports page
  const isTimeLogs = title === "Time Logs";
  const isReports = title === "Reports";
  const showTimesheetsDropdown = isTimeLogs;
  // Don't show date range picker on any pages now (handled in page-specific headers)
  const showDateRangePicker = false;
  // Show report tabs only on reports page
  const showReportsTabs = isReports;

  return (
    <SidebarProvider>
      <DashboardLayoutContent 
        theme={theme}
        title={title}
        profile={profile}
        fullWidth={fullWidth}
        headerActions={headerActions}
        showSettingsTabs={showSettingsTabs}
        activeSettingsTab={activeSettingsTab}
        onSettingsTabChange={onSettingsTabChange}
        isTimeLogs={isTimeLogs}
        isReports={isReports}
        showTimesheetsDropdown={showTimesheetsDropdown}
        showDateRangePicker={showDateRangePicker}
        showReportsTabs={showReportsTabs}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  )
}

function DashboardLayoutContent({ 
  children, 
  theme, 
  title, 
  profile, 
  fullWidth, 
  headerActions, 
  showSettingsTabs, 
  activeSettingsTab, 
  onSettingsTabChange,
  isReports,
  showTimesheetsDropdown,
  showDateRangePicker,
  showReportsTabs,
  selectedSection,
  setSelectedSection
}: DashboardLayoutClientProps & {
  theme: string | undefined
  isTimeLogs: boolean
  isReports: boolean
  showTimesheetsDropdown: boolean
  showDateRangePicker: boolean
  showReportsTabs: boolean
  selectedSection: string | null
  setSelectedSection: (section: string | null) => void
}) {
  const { isSecondarySidebarCollapsed, setIsSecondarySidebarCollapsed } = useSidebarCollapse()

  const layoutContent = (
    <div className="flex h-screen overflow-hidden">
      {/* Primary Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex">
        <PrimarySidebar 
          onSectionChange={setSelectedSection}
          isSecondarySidebarCollapsed={isSecondarySidebarCollapsed}
          onToggleSecondarySidebar={() => setIsSecondarySidebarCollapsed(!isSecondarySidebarCollapsed)}
          profile={profile}
        />
      </div>
      
      {/* Secondary Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex">
        <SecondarySidebar 
          profile={profile} 
          section={selectedSection}
          isCollapsed={isSecondarySidebarCollapsed}
          onToggleCollapse={() => setIsSecondarySidebarCollapsed(!isSecondarySidebarCollapsed)}
        />
      </div>
      
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
            showSettingsTabs={showSettingsTabs}
            activeSettingsTab={activeSettingsTab}
            onSettingsTabChange={onSettingsTabChange}
          >
            {headerActions}
          </SiteHeader>
        )}
        
        {/* Page Content */}
        <main 
          className="flex-1 overflow-auto pb-16 md:pb-0"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff'
          }}
        >
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-2 md:gap-6 md:py-3">
              <div className={fullWidth ? "" : "px-3 sm:px-4 lg:px-6"}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileBottomNav />
      
      {/* Setup Guide Dropdown - Lazy Loaded */}
      {/* <LazySetupGuide /> */}
      
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