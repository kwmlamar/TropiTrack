import { createClient } from '@/utils/supabase/server';
import ClientTable from "@/components/clients/client-table";
import DashboardLayout from '@/components/layouts/dashboard-layout';

export default async function ClientPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
        return <div>Unauthorized</div>
    }

    return (
        <DashboardLayout title='Clients' >
            <div className="container mx-auto p-6">
                <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                    <ClientTable user={user}/>
                </div>
            </div>
        </DashboardLayout>
    )
}