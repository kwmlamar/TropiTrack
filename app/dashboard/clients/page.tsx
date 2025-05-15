import { createClient } from '@/utils/supabase/server';
import ClientTable from "@/components/clients/client-table";

export default async function ClientPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
        return <div>Unauthorized</div>
    }

    return (
        <ClientTable user={user}/>
    )
}