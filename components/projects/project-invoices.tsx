import Link from "next/link"
import { format } from "date-fns"
import type { Invoice } from "@/lib/types/invoice"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { Button } from "@/components/ui/button"

interface ProjectInvoicesProps {
  invoices: Invoice[]
  projectId: string
  clientId?: string
}

export function ProjectInvoices({ invoices, projectId, clientId }: ProjectInvoicesProps) {
  const newInvoiceHref = clientId
    ? `/dashboard/invoices/new?projectId=${projectId}&clientId=${clientId}`
    : `/dashboard/invoices/new?projectId=${projectId}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project invoices</h3>
          <p className="text-sm text-muted-foreground">
            Track billing progress and outstanding balances for this project.
          </p>
        </div>
        <Button asChild>
          <Link href={newInvoiceHref}>Create invoice</Link>
        </Button>
      </div>

      <div className="rounded-2xl border bg-card">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <p>No invoices yet.</p>
            <p>Create your first invoice to start billing this project.</p>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{invoice.invoice_number}</div>
                  <div className="text-xs text-muted-foreground">
                    Issued {format(new Date(invoice.issue_date), "MMM d, yyyy")} · Due{" "}
                    {format(new Date(invoice.due_date), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      ${Number(invoice.total_amount || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Paid ${Number(invoice.amount_paid || 0).toFixed(2)}
                    </div>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

