"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import { CompanySetupDialog } from "@/components/company-setup-dialog"
import { PWAInstaller } from "@/components/pwa-installer"
import { SafariInstallGuide } from "@/components/safari-install-guide"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

type DashboardLayoutClientProps = {
  children: React.ReactNode
  title: string
  profile: UserProfileWithCompany
}

export function DashboardLayoutClient({ children, title, profile }: DashboardLayoutClientProps) {
  // Determine if this is the dashboard overview page
  const isDashboard = title === "Dashboard";
  return (
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
        <SiteHeader title={title} hideDateRangePicker={isDashboard} />
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
      
      {/* PWA Installer (Chrome/Edge/Firefox) */}
      <PWAInstaller />
      
      {/* Safari Install Guide */}
      <SafariInstallGuide />
    </SidebarProvider>
  )
} 