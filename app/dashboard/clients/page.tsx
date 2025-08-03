import { createClient } from '@/utils/supabase/server';
import ClientTable from "@/components/clients/client-table";
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { OnboardingProvider } from '@/context/onboarding-context';
import { OnboardingCheck } from '@/components/onboarding/onboarding-check';

export default async function ClientPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
        return <div>Unauthorized</div>
    }

    return (
        <OnboardingProvider>
            <DashboardLayout title='Clients' >
                <div className="container mx-auto p-6">
                    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <OnboardingCheck 
                            currentStep="clients"
                            fallback={<ClientTable user={user}/>}
                        >
                            <div className="text-center py-8">
                                <h2 className="text-xl font-semibold mb-4">Add Your First Client</h2>
                                <p className="text-gray-600 mb-6">
                                    Start by adding your first client to get organized.
                                </p>
                                <ClientTable user={user}/>
                            </div>
                        </OnboardingCheck>
                    </div>
                </div>
            </DashboardLayout>
        </OnboardingProvider>
    )
}