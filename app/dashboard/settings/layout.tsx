import DashboardLayout from "@/components/layouts/dashboard-layout"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout title="Settings">{children}</DashboardLayout>
} 