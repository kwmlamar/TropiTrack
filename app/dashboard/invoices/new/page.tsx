import DashboardLayout from "@/components/layouts/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoiceHeaderActions } from "@/components/invoices/invoice-header-actions"
import { notFound } from "next/navigation"

const projectSelect = "id, name, client_id"
const clientSelect = "id, name"

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; clientId?: string }>
}) {
  const { projectId, clientId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("User not found")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) {
    notFound()
  }

  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select(projectSelect)
      .eq("company_id", profile.company_id)
      .order("name"),
    supabase
      .from("clients")
      .select(clientSelect)
      .eq("company_id", profile.company_id)
      .order("name"),
  ])

  return (
    <DashboardLayout
      title="New Invoice"
      headerActions={<InvoiceHeaderActions formId="invoice-form" />}
    >
      <InvoiceForm
        userId={user.id}
        projects={projects || []}
        clients={clients || []}
        prefillProjectId={projectId}
        prefillClientId={clientId}
        variant="details-only"
        formId="invoice-form"
      />
    </DashboardLayout>
  )
}

