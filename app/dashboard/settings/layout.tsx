import DashboardLayout from "@/components/layouts/dashboard-layout"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout 
      title="Settings"
      showSettingsTabs={true}
      activeSettingsTab="general"
    >
      <div className="space-y-6 mt-2">
        <SettingsNav />
        {children}
      </div>
    </DashboardLayout>
  )
} 