import DashboardLayout from "@/components/layouts/dashboard-layout";
import WorkersTable from "@/components/workers/worker-table";
import { StandaloneWorkersStep } from "@/components/onboarding/standalone-workers-step";
import { createClient } from "@/utils/supabase/server";
import { OnboardingCheck } from "@/components/onboarding/onboarding-check";

export default async function WorkerPage() {
    const supabase = await createClient();

    const {data: {user}, error} = await supabase.auth.getUser();
    if (error || !user) throw new Error("User not found");
    
    return (
        <OnboardingCheck 
            currentStep="workers"
            fallback={
                <DashboardLayout title="Workers" >
                    <div className="container mx-auto p-6">
                        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                            <WorkersTable user={user} />
                        </div>
                    </div>
                </DashboardLayout>
            }
        >
            <StandaloneWorkersStep />
        </OnboardingCheck>
    )
}