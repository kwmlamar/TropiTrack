import { createClient } from '@/utils/supabase/server';
import ClientTable from "@/components/clients/client-table";

export default async function ClientPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    return (
        <ClientTable user={user}/>
    )
}