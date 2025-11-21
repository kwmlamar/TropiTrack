"use client"

import { useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getInvoices } from "@/lib/data/invoices"
import { fetchProjectsForCompany, fetchClientsForCompany } from "@/lib/data/data"
import type { Invoice, InvoiceStatus } from "@/lib/types/invoice"
import type { Project } from "@/lib/types/project"
import type { Client } from "@/lib/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Mail, FileText, Pencil, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"

const statusOptions: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
]

interface FilterState {
  search: string
  projectId: string
  clientId: string
  status: InvoiceStatus | "all"
  dueFrom: string
  dueTo: string
}

const defaultFilters: FilterState = {
  search: "",
  projectId: "all",
  clientId: "all",
  status: "all",
  dueFrom: "",
  dueTo: "",
}

export default function InvoicesPage({ user }: { user: User }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFilterData()
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      loadInvoices()
    }, filters.search ? 300 : 0)

    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchFilterData = async () => {
    try {
      const [projectList, clientList] = await Promise.all([
        fetchProjectsForCompany(user.id),
        fetchClientsForCompany(user.id),
      ])

      setProjects(projectList)
      setClients(clientList)
    } catch (error) {
      console.error("Failed to load filter data:", error)
    }
  }

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getInvoices(user.id, {
        search: filters.search || undefined,
        project_id: filters.projectId !== "all" ? filters.projectId : undefined,
        client_id: filters.clientId !== "all" ? filters.clientId : undefined,
        status: filters.status,
        due_date_from: filters.dueFrom || undefined,
        due_date_to: filters.dueTo || undefined,
      })

      if (error) {
        setError(error)
        toast.error(error)
      } else {
        setInvoices(data || [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load invoices"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!invoice.client?.email) {
      toast.error("This invoice does not have a client email")
      return
    }

    const promise = fetch("/api/invoices/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        to: invoice.client.email,
        attachPdf: true,
      }),
    })

    toast.promise(promise, {
      loading: "Sending invoice...",
      success: () => "Invoice sent successfully",
      error: "Failed to send invoice",
    })
  }

  const filteredSummary = useMemo(() => {
    const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0)
    const paid = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0)
    const outstanding = total - paid
    const overdue = invoices.filter((invoice) => invoice.status === "overdue").length

    return { total, paid, outstanding, overdue }
  }, [invoices])

  const resetFilters = () => setFilters(defaultFilters)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Billed</p>
          <p className="mt-2 text-2xl font-semibold">${filteredSummary.total.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            ${filteredSummary.paid.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">
            ${Math.max(filteredSummary.outstanding, 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-red-500">{filteredSummary.overdue}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search invoices"
              value={filters.search}
              onChange={(event) => handleFilterChange("search", event.target.value)}
              className="h-11"
            />
            <Select
              value={filters.projectId}
              onValueChange={(value) => handleFilterChange("projectId", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.clientId}
              onValueChange={(value) => handleFilterChange("clientId", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value as InvoiceStatus | "all")}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRefreshing(true)
                loadInvoices()
              }}
              className="h-11"
              disabled={refreshing || loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" onClick={resetFilters} className="h-11">
              Clear
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due from</label>
            <Input
              type="date"
              value={filters.dueFrom}
              onChange={(event) => handleFilterChange("dueFrom", event.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due to</label>
            <Input
              type="date"
              value={filters.dueTo}
              onChange={(event) => handleFilterChange("dueTo", event.target.value)}
              className="h-11"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                {["Invoice", "Client", "Project", "Due Date", "Amount", "Status", ""].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    No invoices found for your filters.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">
                        Issued {format(new Date(invoice.issue_date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{invoice.client?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{invoice.client?.company}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-muted-foreground">{invoice.project?.name || "—"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm">
                        {format(new Date(invoice.due_date), "MMM d, yyyy")}
                      </div>
                      {invoice.status === "overdue" && (
                        <div className="text-xs text-destructive">Overdue</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        ${Number(invoice.total_amount || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Paid ${Number(invoice.amount_paid || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="flex items-center"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`/api/invoices/${invoice.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              PDF
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendInvoice(invoice)}
                            className="cursor-pointer"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send to client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/projects/${invoice.project_id}`}
                              className="flex items-center"
                            >
                              View project
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {error && (
          <div className="border-t border-border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

