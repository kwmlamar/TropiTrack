import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { redirect } from 'next/navigation';
import DashboardLayout from "@/components/layouts/dashboard-layout";
import BulkTimesheetPage from "@/components/timesheets/bulk-timesheet-page";
import { BulkTimesheetHeaderActionsWrapper } from "@/components/timesheets/bulk-timesheet-header-actions-wrapper";

export default async function Page() {
  const user = await getUserProfileWithCompany();

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout 
      title="Timesheets Entry"
      fullWidth={true}
      headerActions={<BulkTimesheetHeaderActionsWrapper />}
    >
      <BulkTimesheetPage user={user} />
    </DashboardLayout>
  );
} 