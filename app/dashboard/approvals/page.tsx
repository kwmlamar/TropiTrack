import DashboardLayout from "@/components/layouts/dashboard-layout";
import { TimeLogsPage } from "@/components/timesheets/time-logs";
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
    <DashboardLayout title="Time Logs">
      <TimeLogsPage user={user} />
    </DashboardLayout>
  );
} 