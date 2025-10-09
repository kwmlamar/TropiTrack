import DashboardLayout from "@/components/layouts/dashboard-layout";
import WorkersTable from "@/components/workers/worker-table";
import { createClient } from "@/utils/supabase/server";
import { WorkersHeaderActions } from "@/components/workers/workers-header-actions";

export default async function WorkerPage() {
    const supabase = await createClient();

    const {data: {user}, error} = await supabase.auth.getUser();
    if (error || !user) throw new Error("User not found");
    
    return (
        <DashboardLayout 
            title="Workers" 
            fullWidth={true}
            headerActions={<WorkersHeaderActions userId={user.id} />}
        >
            <WorkersTable user={user} />
        </DashboardLayout>
    )
}