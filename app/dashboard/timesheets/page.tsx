import TimesheetsTable from "@/components/timesheets/timesheets-table";
import { createClient } from "@/utils/supabase/server";

export default async function TimesheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not found");
  }

  return <TimesheetsTable user={user} />;
}