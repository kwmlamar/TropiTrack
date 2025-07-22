import DashboardLayout from "@/components/layouts/dashboard-layout"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <SettingsNav />
        {children}
      </div>
    </DashboardLayout>
  )
} 