import DashboardLayout from "@/components/layouts/dashboard-layout"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <DashboardClient />
    </DashboardLayout>
  )
}
