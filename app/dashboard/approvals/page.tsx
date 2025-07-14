import DashboardLayout from "@/components/layouts/dashboard-layout";
import { ApprovalsPage } from "@/components/timesheets/approvals-page";

export default async function Page() {
  return (
    <DashboardLayout title="Approvals">
      <ApprovalsPage />
    </DashboardLayout>
  );
} 