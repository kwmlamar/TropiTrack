import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { redirect } from 'next/navigation';
import { PayrollPageClient } from "@/components/payroll/payroll-page-client";

export default async function Page() {
  const user = await getUserProfileWithCompany();

  if (!user) {
    redirect('/login');
  }

  return <PayrollPageClient user={user} />;
}
