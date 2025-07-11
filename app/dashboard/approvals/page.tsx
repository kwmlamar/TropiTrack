import DashboardLayout from "@/components/layouts/dashboard-layout";
import { ApprovalsPage } from "@/components/timesheets/approvals-page";
import { createClient } from "@/utils/supabase/server";

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
    <DashboardLayout title="Approvals">
      <ApprovalsPage user={user} />
    </DashboardLayout>
  );
} 