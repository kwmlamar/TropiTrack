import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { getClient } from '@/lib/data/clients';
import { getProfile } from '@/lib/data/data';
import { notFound } from 'next/navigation';
import { ClientSummary } from '@/components/clients/client-summary';
import { ClientTabs } from '@/components/clients/client-tabs';
import { ClientDetailPageClient } from '@/components/clients/client-detail-page-client';

interface ClientDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;
  
  // Handle "new" route - redirect to new client page or show create form
  if (id === "new") {
    // For now, show 404
    // You may want to create a separate new client page
    notFound();
  }

  // Validate that id is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error("Invalid client ID format:", id);
    notFound();
  }

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

  if (!profile.company_id) {
    throw new Error("User profile missing company_id");
  }

  // Fetch client details
  const clientResult = await getClient(profile.company_id, id);
  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;

  return (
    <ClientDetailPageClient>
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
    </ClientDetailPageClient>
  )
}
