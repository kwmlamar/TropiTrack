import DashboardLayout from "@/components/layouts/dashboard-layout";
import PayrollPage from "@/components/payroll/page";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUserProfileWithCompany();

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout title="Payroll">
      <PayrollPage user={user} />
    </DashboardLayout>
  );
}
