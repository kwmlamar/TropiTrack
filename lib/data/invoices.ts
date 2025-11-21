import { supabase } from "@/lib/supabaseClient"
import { getProfile } from "@/lib/data/data"
import type { ApiResponse } from "@/lib/types"
import type {
  Invoice,
  InvoiceFilters,
  InvoiceLineItemType,
  InvoicePayment,
  InvoiceStatus,
  NewInvoice,
  UpdateInvoice,
} from "@/lib/types/invoice"
import { escapeSearchTerm } from "@/lib/utils"

const invoiceSelect = `
  *,
  project:projects(id, name),
  client:clients(id, name, company, email, phone),
  line_items:invoice_line_items(*),
  payments:invoice_payments(*)
`

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return parseFloat(value)
  return 0
}

function deriveInvoiceStatus(invoice: {
  status: InvoiceStatus
  total_amount: number
  amount_paid: number
  due_date: string
}): InvoiceStatus {
  const total = toNumber(invoice.total_amount)
  const paid = toNumber(invoice.amount_paid)
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null
  const today = new Date()

  if (total > 0 && paid >= total - 0.01) {
    return "paid"
  }

  if (invoice.status === "draft") {
    return "draft"
  }

  if (dueDate && dueDate < today) {
    return "overdue"
  }

  return invoice.status
}

async function generateInvoiceNumber(companyId: string): Promise<string> {
  const now = new Date()
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("company_id", companyId)
    .like("invoice_number", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return `${prefix}-001`
  }

  const lastNumber = data[0].invoice_number?.split("-").pop()
  const nextSequence = lastNumber ? parseInt(lastNumber, 10) + 1 : 1
  return `${prefix}-${String(nextSequence).padStart(3, "0")}`
}

async function syncInvoiceFinancials(invoiceId: string) {
  const { error } = await supabase.rpc("recalculate_invoice_totals", {
    p_invoice_id: invoiceId,
  })

  if (error) {
    console.error("Failed to recalculate invoice totals:", error)
  }
}

export async function getInvoices(
  userId: string,
  filters: InvoiceFilters = {}
): Promise<ApiResponse<Invoice[]>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  try {
    let query = supabase
      .from("invoices")
      .select(invoiceSelect)
      .eq("company_id", profile.company_id)
      .order("issue_date", { ascending: false })

    if (filters.project_id) {
      query = query.eq("project_id", filters.project_id)
    }

    if (filters.client_id) {
      query = query.eq("client_id", filters.client_id)
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters.due_date_from) {
      query = query.gte("due_date", filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte("due_date", filters.due_date_to)
    }

    if (filters.search) {
      const escaped = escapeSearchTerm(filters.search)
      query = query.or(
        `invoice_number.ilike.%${escaped}%,notes.ilike.%${escaped}%,terms.ilike.%${escaped}%`
      )
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    if (filters.sort_by) {
      query = query.order(filters.sort_by, {
        ascending: filters.sort_direction !== "desc",
      })
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching invoices:", error)
      return { data: null, error: error.message, success: false }
    }

    const invoices = (data || []).map((invoice) => {
      const derived = deriveInvoiceStatus(invoice as Invoice)
      return { ...invoice, status: derived } as Invoice
    })

    return { data: invoices, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching invoices:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

export async function getInvoice(
  userId: string,
  invoiceId: string
): Promise<ApiResponse<Invoice>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  try {
    const { data, error } = await supabase
      .from("invoices")
      .select(invoiceSelect)
      .eq("company_id", profile.company_id)
      .eq("id", invoiceId)
      .single()

    if (error) {
      console.error("Error fetching invoice:", error)
      return { data: null, error: error.message, success: false }
    }

    if (!data) {
      return { data: null, error: "Invoice not found", success: false }
    }

    const derived = deriveInvoiceStatus(data as Invoice)

    if (derived !== data.status) {
      await supabase
        .from("invoices")
        .update({ status: derived })
        .eq("id", data.id)
    }

    return {
      data: { ...data, status: derived } as Invoice,
      error: null,
      success: true,
    }
  } catch (error) {
    console.error("Unexpected error fetching invoice:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

function prepareLineItems(
  invoiceId: string,
  lineItems: NonNullable<NewInvoice["line_items"]>
) {
  return lineItems.map((item) => ({
    ...item,
    invoice_id: invoiceId,
    total: Number(item.quantity || 0) * Number(item.unit_price || 0),
  }))
}

export async function createInvoice(
  userId: string,
  payload: NewInvoice
): Promise<ApiResponse<Invoice>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  const lineItems = payload.line_items || []
  const payments = payload.payments || []

  const subtotal = lineItems.reduce((sum, item) => {
    const total = Number(item.quantity || 0) * Number(item.unit_price || 0)
    return sum + total
  }, 0)

  const amountPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const invoiceNumber = payload.invoice_number || (await generateInvoiceNumber(profile.company_id))
  const initialStatus: InvoiceStatus = payload.status || "draft"

  try {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        company_id: profile.company_id,
        project_id: payload.project_id,
        client_id: payload.client_id,
        invoice_number: invoiceNumber,
        status: initialStatus,
        issue_date: payload.issue_date,
        due_date: payload.due_date,
        currency: payload.currency || "USD",
        subtotal,
        total_amount: subtotal,
        amount_paid: amountPaid,
        notes: payload.notes,
        terms: payload.terms,
        metadata: payload.metadata || {},
        created_by: userId,
        updated_by: userId,
      })
      .select("id")
      .single()

    if (error || !invoice) {
      console.error("Error creating invoice:", error)
      return { data: null, error: error?.message || "Failed to create invoice", success: false }
    }

    if (lineItems.length > 0) {
      const prepared = prepareLineItems(invoice.id, lineItems)
      const { error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .insert(prepared)

      if (lineItemsError) {
        console.error("Failed to insert invoice line items:", lineItemsError)
        return { data: null, error: lineItemsError.message, success: false }
      }
    }

    if (payments.length > 0) {
      const { error: paymentsError } = await supabase.from("invoice_payments").insert(
        payments.map((payment) => ({
          ...payment,
          invoice_id: invoice.id,
          created_by: userId,
        }))
      )

      if (paymentsError) {
        console.error("Failed to insert invoice payments:", paymentsError)
        return { data: null, error: paymentsError.message, success: false }
      }
    }

    await syncInvoiceFinancials(invoice.id)
    return getInvoice(userId, invoice.id)
  } catch (error) {
    console.error("Unexpected error creating invoice:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

async function upsertLineItems(
  invoiceId: string,
  lineItems: NonNullable<UpdateInvoice["line_items"]>
) {
  for (const item of lineItems) {
    const normalized = {
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      type: item.type as InvoiceLineItemType,
      metadata: item.metadata,
    }

    if (item._delete && item.id) {
      await supabase.from("invoice_line_items").delete().eq("id", item.id)
      continue
    }

    if (item.id) {
      await supabase
        .from("invoice_line_items")
        .update({
          ...normalized,
          total: Number(item.quantity || 0) * Number(item.unit_price || 0),
        })
        .eq("id", item.id)
    } else {
      await supabase.from("invoice_line_items").insert({
        ...normalized,
        invoice_id: invoiceId,
        total: Number(item.quantity || 0) * Number(item.unit_price || 0),
      })
    }
  }
}

async function upsertPayments(
  invoiceId: string,
  userId: string,
  payments: NonNullable<UpdateInvoice["payments"]>
) {
  for (const payment of payments) {
    if (payment._delete && payment.id) {
      await supabase.from("invoice_payments").delete().eq("id", payment.id)
      continue
    }

    if (payment.id) {
      await supabase
        .from("invoice_payments")
        .update({
          amount: payment.amount,
          payment_date: payment.payment_date,
          method: payment.method,
          notes: payment.notes,
          metadata: payment.metadata,
        })
        .eq("id", payment.id)
    } else {
      await supabase.from("invoice_payments").insert({
        invoice_id: invoiceId,
        amount: payment.amount,
        payment_date: payment.payment_date,
        method: payment.method,
        notes: payment.notes,
        metadata: payment.metadata,
        created_by: userId,
      })
    }
  }
}

export async function updateInvoice(
  userId: string,
  invoiceId: string,
  payload: UpdateInvoice
): Promise<ApiResponse<Invoice>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  const { line_items, payments, ...invoiceData } = payload

  try {
    if (Object.keys(invoiceData).length > 0) {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          ...invoiceData,
          updated_by: userId,
        })
        .eq("company_id", profile.company_id)
        .eq("id", invoiceId)

      if (updateError) {
        console.error("Failed to update invoice:", updateError)
        return { data: null, error: updateError.message, success: false }
      }
    }

    if (line_items && line_items.length > 0) {
      await upsertLineItems(invoiceId, line_items)
    }

    if (payments && payments.length > 0) {
      await upsertPayments(invoiceId, userId, payments)
    }

    await syncInvoiceFinancials(invoiceId)
    return getInvoice(userId, invoiceId)
  } catch (error) {
    console.error("Unexpected error updating invoice:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

export async function deleteInvoice(
  userId: string,
  invoiceId: string
): Promise<ApiResponse<boolean>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  try {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("company_id", profile.company_id)
      .eq("id", invoiceId)

    if (error) {
      console.error("Failed to delete invoice:", error)
      return { data: null, error: error.message, success: false }
    }

    return { data: true, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error deleting invoice:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

export async function recordInvoicePayment(
  userId: string,
  invoiceId: string,
  payment: Omit<InvoicePayment, "id" | "invoice_id" | "created_at" | "updated_at">
): Promise<ApiResponse<Invoice>> {
  try {
    const { error } = await supabase.from("invoice_payments").insert({
      ...payment,
      invoice_id: invoiceId,
      created_by: userId,
    })

    if (error) {
      console.error("Failed to record payment:", error)
      return { data: null, error: error.message, success: false }
    }

    await syncInvoiceFinancials(invoiceId)
    return getInvoice(userId, invoiceId)
  } catch (error) {
    console.error("Unexpected error recording payment:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

export async function getApprovedTimesheetsForProject(
  userId: string,
  projectId: string,
  options: { date_from?: string; date_to?: string } = {}
): Promise<ApiResponse<
  Array<{
    id: string
    worker_id: string
    worker_name: string
    date: string
    total_hours: number
    hourly_rate: number
    total_pay: number
  }>
>> {
  const profile = await getProfile(userId)

  if (!profile?.company_id) {
    return { data: null, error: "Company not found for user", success: false }
  }

  try {
    let query = supabase
      .from("timesheets")
      .select(
        `
        id,
        worker_id,
        date,
        total_hours,
        total_pay,
        worker:workers(id, name, hourly_rate)
      `
      )
      .eq("company_id", profile.company_id)
      .eq("project_id", projectId)
      .eq("supervisor_approval", "approved")
      .order("date", { ascending: false })

    if (options.date_from) {
      query = query.gte("date", options.date_from)
    }

    if (options.date_to) {
      query = query.lte("date", options.date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching project timesheets:", error)
      return { data: null, error: error.message, success: false }
    }

    const timesheets =
      data?.map((timesheet) => ({
        id: timesheet.id,
        worker_id: timesheet.worker_id,
        worker_name: timesheet.worker?.name || "Worker",
        date: timesheet.date,
        total_hours: timesheet.total_hours,
        hourly_rate: timesheet.worker?.hourly_rate || 0,
        total_pay: timesheet.total_pay,
      })) || []

    return { data: timesheets, error: null, success: true }
  } catch (error) {
    console.error("Unexpected error fetching project timesheets:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}


