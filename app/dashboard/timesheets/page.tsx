import DashboardLayout from "@/components/layouts/DashboardLayout";
import TimesheetsPage from "@/components/timesheets2/timesheets-page";
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
    <DashboardLayout title="Timesheets">
      <TimesheetsPage />
    </DashboardLayout>
  );
}