import DashboardLayout from "@/components/layouts/dashboard-layout";
import TimesheetsPage from "@/components/timesheets/timesheets-page";
import { createClient } from "@/utils/supabase/server";
import { OnboardingCheck } from '@/components/onboarding/onboarding-check';

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
      <OnboardingCheck 
          currentStep="timesheets"
          fallback={<TimesheetsPage user={user}/>}
      >
        <TimesheetsPage user={user}/>
      </OnboardingCheck>
    </DashboardLayout>
  );
}