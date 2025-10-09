import DashboardLayout from "@/components/layouts/dashboard-layout"
import ReportsPageClient from "@/components/reports/reports-page-client"

export default function ReportsPage() {
  return (
    <DashboardLayout title="Reports">
      <ReportsPageClient />
    </DashboardLayout>
  )
} 