import DashboardLayout from "@/components/layouts/dashboard-layout";
import BulkTimesheetPage from "@/components/timesheets/bulk-timesheet-page";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUserProfileWithCompany();

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout title="Timesheets Entry">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
        <BulkTimesheetPage user={user} />
      </div>
    </DashboardLayout>
  );
} 