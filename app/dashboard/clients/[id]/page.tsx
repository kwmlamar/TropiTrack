import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { getClient } from '@/lib/data/clients';
import { getProfile } from '@/lib/data/data';
import { notFound } from 'next/navigation';
import { ClientSummary } from '@/components/clients/client-summary';
import { ClientTabs } from '@/components/clients/client-tabs';

interface ClientDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    return <div>Unauthorized</div>
  }

  // Get user profile to get company ID
  const profile = await getProfile(user.id);
  if (!profile) {
    return <div>Profile not found</div>
  }

  // Fetch client details
  const clientResult = await getClient(profile.company_id, id);
  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;

  return (
    <DashboardLayout title={
      <>
        <span className="text-gray-500">Client</span> <span className="text-gray-500">/</span> {client.name}
      </>
    }>
      <div className="container mx-auto p-6">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <div className="space-y-6">
            {/* Summary Cards */}
            <ClientSummary clientId={client.id} companyId={profile.company_id} />

            {/* Tabs */}
            <ClientTabs clientId={client.id} companyId={profile.company_id} client={client} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
