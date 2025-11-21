import type { Project } from "./project"
import type { Client } from "./client"

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"
export type InvoiceLineItemType = "service" | "material" | "expense"

export interface InvoiceLineItemMetadata {
  source?: "manual" | "timesheet" | "import"
  timesheet_ids?: string[]
  worker_name?: string
  notes?: string
  [key: string]: unknown
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  type: InvoiceLineItemType
  description: string
  quantity: number
  unit_price: number
  total: number
  metadata?: InvoiceLineItemMetadata
  created_at: string
  updated_at: string
}

export interface InvoicePayment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  method?: string
  notes?: string
  metadata?: Record<string, unknown>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  company_id: string
  project_id: string
  client_id: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  currency: string
  subtotal: number
  total_amount: number
  amount_paid: number
  notes?: string
  terms?: string
  metadata?: Record<string, unknown>
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  project?: Pick<Project, "id" | "name">
  client?: Pick<Client, "id" | "name" | "company" | "email" | "phone">
  line_items?: InvoiceLineItem[]
  payments?: InvoicePayment[]
}

export type NewInvoice = Omit<
  Invoice,
  | "id"
  | "company_id"
  | "invoice_number"
  | "subtotal"
  | "total_amount"
  | "amount_paid"
  | "created_at"
  | "updated_at"
> & {
  invoice_number?: string
  line_items?: Omit<InvoiceLineItem, "id" | "invoice_id" | "created_at" | "updated_at">[]
  payments?: Omit<InvoicePayment, "id" | "invoice_id" | "created_at" | "updated_at">[]
}

export type UpdateInvoice = Partial<
  Omit<
    Invoice,
    "id" | "company_id" | "created_at" | "updated_at" | "line_items" | "payments"
  >
> & {
  line_items?: Array<
    Partial<Omit<InvoiceLineItem, "invoice_id">> & { id?: string; _delete?: boolean }
  >
  payments?: Array<
    Partial<Omit<InvoicePayment, "invoice_id">> & { id?: string; _delete?: boolean }
  >
}

export type InvoiceFilters = {
  search?: string
  project_id?: string
  client_id?: string
  status?: InvoiceStatus | "all"
  due_date_from?: string
  due_date_to?: string
  limit?: number
  offset?: number
  sort_by?: "issue_date" | "due_date" | "status" | "amount"
  sort_direction?: "asc" | "desc"
}

export type InvoiceTimesheetImportOptions = {
  project_id: string
  date_from?: string
  date_to?: string
  worker_ids?: string[]
}

