import DashboardLayout from "@/components/layouts/dashboard-layout";
import { createClient } from "@/utils/supabase/server";
import AccountingPage from "@/components/accounting/accounting-page";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not found");
  }

  return (
    <DashboardLayout title="Accounting">
      <AccountingPage user={user} />
    </DashboardLayout>
  );
} 