import DashboardLayout from "@/components/layouts/DashboardLayout";
import WorkersTable from "@/components/workers/worker-table";
import { createClient } from "@/utils/supabase/server";

export default async function WorkerPage() {
    const supabase = await createClient();

    const {data: {user}, error} = await supabase.auth.getUser();
    if (error || !user) throw new Error("User not found");
    
    return (
        <DashboardLayout title="Workers" >
            <WorkersTable user={user} />
        </DashboardLayout>
        
    )

}