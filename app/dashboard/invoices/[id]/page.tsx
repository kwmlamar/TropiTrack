import DashboardLayout from "@/components/layouts/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoiceHeaderActions } from "@/components/invoices/invoice-header-actions"
import { notFound } from "next/navigation"

const projectSelect = "id, name, client_id"
const clientSelect = "id, name"
const invoiceSelect = `
  *,
  project:projects(id, name),
  client:clients(id, name, company, email, phone),
  line_items:invoice_line_items(*),
  payments:invoice_payments(*)
`

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("company_id", profile.company_id)
    .eq("id", id)
    .single()

  if (invoiceError || !invoice) {
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
      title={`Invoice ${invoice.invoice_number}`}
      headerActions={<InvoiceHeaderActions formId="invoice-form" invoiceId={invoice.id} />}
    >
      <InvoiceForm
        userId={user.id}
        projects={projects || []}
        clients={clients || []}
        initialInvoice={invoice}
        formId="invoice-form"
      />
    </DashboardLayout>
  )
}

