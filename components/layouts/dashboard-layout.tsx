import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from "./dashboard-layout-client"

type DashboardLayoutProps = {
  children: React.ReactNode
  title?: string | React.ReactNode
  fullWidth?: boolean
  headerActions?: React.ReactNode
  showSettingsTabs?: boolean
  activeSettingsTab?: string
  onSettingsTabChange?: (tab: string) => void
}

export default async function DashboardLayout({ 
  children,
  title = "Dashboard",
  fullWidth = false,
  headerActions,
  showSettingsTabs = false,
  activeSettingsTab = "general",
  onSettingsTabChange,
}: DashboardLayoutProps) {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect('/login')
  }

  return <DashboardLayoutClient profile={profile} title={title} fullWidth={fullWidth} headerActions={headerActions} showSettingsTabs={showSettingsTabs} activeSettingsTab={activeSettingsTab} onSettingsTabChange={onSettingsTabChange}>{children}</DashboardLayoutClient>
}
