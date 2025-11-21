"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useRouter } from "next/navigation"
import type { Invoice, InvoiceLineItemMetadata, InvoiceLineItemType, InvoiceStatus } from "@/lib/types/invoice"
import type { Project } from "@/lib/types/project"
import type { Client } from "@/lib/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarDays, Plus, Trash2, Upload, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { createInvoice, updateInvoice } from "@/lib/data/invoices"
import type { NewInvoice, UpdateInvoice } from "@/lib/types/invoice"
import { InvoiceTimesheetDrawer } from "./invoice-timesheet-drawer"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

type LineItemFormValue = {
  id?: string
  description: string
  type: InvoiceLineItemType
  quantity: number
  unit_price: number
  metadata?: InvoiceLineItemMetadata
}

type PaymentFormValue = {
  id?: string
  amount: number
  payment_date: string
  method?: string
  notes?: string
  metadata?: Record<string, unknown>
}

type InvoiceFormValues = {
  project_id: string
  client_id: string
  invoice_number: string
  issue_date: string
  due_date: string
  status: InvoiceStatus
  currency: string
  notes?: string
  terms?: string
  lineItems: LineItemFormValue[]
  payments: PaymentFormValue[]
}

interface InvoiceFormProps {
  userId: string
  projects: Project[]
  clients: Client[]
  initialInvoice?: Invoice | null
  prefillProjectId?: string
  prefillClientId?: string
  variant?: "full" | "details-only"
  formId?: string
}

const defaultLineItem: LineItemFormValue = {
  description: "",
  type: "service",
  quantity: 1,
  unit_price: 0,
}

export function InvoiceForm({
  userId,
  projects,
  clients,
  initialInvoice,
  prefillProjectId,
  prefillClientId,
  variant = "full",
  formId = "invoice-form",
}: InvoiceFormProps) {
  const router = useRouter()
  const [timesheetDrawerOpen, setTimesheetDrawerOpen] = useState(false)
  const [removedLineItemIds, setRemovedLineItemIds] = useState<string[]>([])
  const [removedPaymentIds, setRemovedPaymentIds] = useState<string[]>([])
  const isFullVariant = variant === "full"
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [issuePickerOpen, setIssuePickerOpen] = useState(false)
  const [duePickerOpen, setDuePickerOpen] = useState(false)
  const [vatRate, setVatRate] = useState<number>(0)

  const defaultIssueDate = initialInvoice?.issue_date || format(new Date(), "yyyy-MM-dd")
  const defaultDueDate =
    initialInvoice?.due_date || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      project_id: initialInvoice?.project_id || prefillProjectId || "",
      client_id: initialInvoice?.client_id || prefillClientId || "",
      invoice_number: initialInvoice?.invoice_number || "",
      issue_date: defaultIssueDate,
      due_date: defaultDueDate,
      status: initialInvoice?.status || "draft",
      currency: initialInvoice?.currency || "USD",
      notes: initialInvoice?.notes || "",
      terms: initialInvoice?.terms || "",
      lineItems: isFullVariant
        ? initialInvoice?.line_items?.map((item) => ({
            id: item.id,
            description: item.description,
            type: item.type,
            quantity: item.quantity,
            unit_price: item.unit_price,
            metadata: item.metadata,
          })) || [defaultLineItem]
        : [],
      payments: isFullVariant
        ? initialInvoice?.payments?.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            payment_date: payment.payment_date,
            method: payment.method,
            notes: payment.notes,
            metadata: payment.metadata,
          })) || []
        : [],
    },
  })

  const {
    control,
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const { fields: lineItemFields, append: appendLineItem, remove: removeLineItem } = useFieldArray({
    control,
    name: "lineItems",
  })

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({ control, name: "payments" })

  const watchedLineItems = watch("lineItems")
  const watchedPayments = watch("payments")
  const selectedProjectId = watch("project_id")
  const issueDateValue = watch("issue_date")
  const dueDateValue = watch("due_date")

  useEffect(() => {
    if (!selectedProjectId) return
    const project = projects.find((proj) => proj.id === selectedProjectId)
    if (project?.client_id) {
      setValue("client_id", project.client_id)
    }
  }, [projects, selectedProjectId, setValue])

  const totals = useMemo(() => {
    const subtotal = watchedLineItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0
    )
    if (!isFullVariant) {
      return { subtotal, payments: 0, balance: 0 }
    }
    const payments = watchedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const balance = Math.max(subtotal - payments, 0)
    return { subtotal, payments, balance }
  }, [isFullVariant, watchedLineItems, watchedPayments])

  const handleAddLineItem = () => appendLineItem(defaultLineItem)

  const handleRemoveLineItem = (index: number) => {
    const field = lineItemFields[index]
    if (field?.id) {
      setRemovedLineItemIds((prev) => [...prev, field.id as string])
    }
    removeLineItem(index)
  }

  const handleRemovePayment = (index: number) => {
    const field = paymentFields[index]
    if (field?.id) {
      setRemovedPaymentIds((prev) => [...prev, field.id as string])
    }
    removePayment(index)
  }

  const handleImportTimesheets = (
    items: Array<{
      description: string
      type: InvoiceLineItemType
      quantity: number
      unit_price: number
      metadata?: InvoiceLineItemMetadata
    }>
  ) => {
    items.forEach((item) => appendLineItem(item))
    toast.success(`Imported ${items.length} service line items from timesheets`)
  }

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      const payload: UpdateInvoice = {
        project_id: values.project_id,
        client_id: values.client_id,
        invoice_number: values.invoice_number,
        issue_date: values.issue_date,
        due_date: values.due_date,
        status: values.status,
        notes: values.notes,
        terms: values.terms,
        currency: values.currency,
        line_items: isFullVariant
          ? [
              ...values.lineItems.map((item) => ({
                id: item.id,
                description: item.description,
                type: item.type,
                quantity: Number(item.quantity || 0),
                unit_price: Number(item.unit_price || 0),
                metadata: item.metadata,
              })),
              ...removedLineItemIds.map((id) => ({ id, _delete: true })),
            ]
          : [],
        payments: isFullVariant
          ? [
              ...values.payments.map((payment) => ({
                id: payment.id,
                amount: Number(payment.amount || 0),
                payment_date: payment.payment_date,
                method: payment.method,
                notes: payment.notes,
                metadata: payment.metadata,
              })),
              ...removedPaymentIds.map((id) => ({ id, _delete: true })),
            ]
          : [],
      }

      const response = initialInvoice
        ? await updateInvoice(userId, initialInvoice.id, payload)
        : await createInvoice(userId, payload as NewInvoice)

      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to save invoice")
        return
      }

      toast.success(initialInvoice ? "Invoice updated" : "Invoice created")

      router.replace(`/dashboard/invoices/${response.data.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save invoice")
    } finally {
      // no-op
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className={cn(isFullVariant ? "grid gap-6 lg:grid-cols-[2fr,1fr]" : "space-y-6")}>
        <div className="space-y-6 pt-2">
          <div className="rounded-2xl border bg-card">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center gap-3 flex-1">
                <Label htmlFor="invoice_number" className="text-sm font-medium">
                  Invoice
                </Label>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-muted-foreground text-lg">#</span>
                  <Input
                    id="invoice_number"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="12345"
                    aria-label="Invoice number"
                    className="w-24"
                    {...register("invoice_number")}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  aria-label="Upload logo"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground text-center px-2">Upload logo</span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      setLogoPreview(null)
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      setLogoPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </div>
            </div>
            <div className="px-6">
              <div className="border-t my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="issue_date" className="text-sm font-medium">
                    Issue date
                  </Label>
                  <Popover open={issuePickerOpen} onOpenChange={setIssuePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        id="issue_date"
                        aria-label="Select issue date"
                        className="inline-flex h-10 min-w-[180px] items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-left">
                          {issueDateValue
                            ? format(new Date(issueDateValue), "MMM d, yyyy")
                            : "Select date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={issueDateValue ? new Date(issueDateValue) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setValue("issue_date", format(date, "yyyy-MM-dd"))
                            setIssuePickerOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.issue_date && (
                  <p className="text-xs text-destructive">Issue date is required</p>
                )}
                <div className="flex items-center gap-3">
                  <Label htmlFor="due_date" className="text-sm font-medium">
                    Due date
                  </Label>
                  <Popover open={duePickerOpen} onOpenChange={setDuePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        id="due_date"
                        aria-label="Select due date"
                        className="inline-flex h-10 min-w-[180px] items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-left">
                          {dueDateValue ? format(new Date(dueDateValue), "MMM d, yyyy") : "Select date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDateValue ? new Date(dueDateValue) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setValue("due_date", format(date, "yyyy-MM-dd"))
                            setDuePickerOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div
                    className="flex-1 rounded-2xl border bg-muted px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">Billed to</span>
                  </div>
                  <ArrowLeftRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div
                    className="flex-1 rounded-2xl border bg-muted px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">Pay to</span>
                  </div>
                </div>
                {/* Line items headers */}
                <div className="rounded-2xl border bg-muted p-3 sm:p-4 mt-3">
                  <div className="hidden md:grid grid-cols-[1fr_80px_100px_120px] items-center gap-3">
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      DESCRIPTION
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase text-right">
                      QTY
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase text-right">
                      RATE
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase text-right">
                      AMOUNT
                    </span>
                  </div>
                </div>
                {/* Line items rows */}
                <div className="mt-2 space-y-2">
                  {lineItemFields.length === 0 && (
                    <div className="rounded-xl border bg-background/50 text-muted-foreground text-sm px-3 py-3">
                      No items yet. Add your first item below.
                    </div>
                  )}
                  {lineItemFields.map((field, index) => {
                    const qty = Number(watch(`lineItems.${index}.quantity` as const)) || 0
                    const rate = Number(watch(`lineItems.${index}.unit_price` as const)) || 0
                    const amount = qty * rate
                    return (
                      <div
                        key={field.id}
                        className="rounded-xl bg-background border px-3 py-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_120px] items-start md:items-center gap-2 md:gap-3">
                          {/* Description */}
                          <div className="flex flex-col">
                            <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              Description
                            </span>
                            <Input
                              placeholder="Item description"
                              {...register(`lineItems.${index}.description` as const)}
                            />
                          </div>
                          {/* Qty */}
                          <div className="flex flex-col">
                            <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              Qty
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              placeholder="0"
                              className="text-right"
                              {...register(`lineItems.${index}.quantity` as const, { valueAsNumber: true })}
                            />
                          </div>
                          {/* Rate */}
                          <div className="flex flex-col">
                            <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              Rate
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              placeholder="0.00"
                              className="text-right"
                              {...register(`lineItems.${index}.unit_price` as const, { valueAsNumber: true })}
                            />
                          </div>
                          {/* Amount */}
                          <div className="flex flex-col">
                            <span className="md:hidden text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              Amount
                            </span>
                            <div className="h-10 flex items-center justify-end rounded-xl border border-transparent bg-transparent px-2 text-sm font-semibold">
                              ${amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendLineItem({
                        description: "",
                        type: "service",
                        quantity: 0,
                        unit_price: 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add item
                  </Button>
                </div>
                {/* Totals section */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div></div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">SUBTOTAL</span>
                      <span className="text-sm font-semibold">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">VAT RATE</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          className="w-20 text-right h-8"
                          value={Number.isFinite(vatRate) ? String(vatRate) : ""}
                          onChange={(e) => {
                            const num = Number(e.target.value)
                            setVatRate(Number.isNaN(num) ? 0 : num)
                          }}
                          aria-label="VAT rate percentage"
                        />
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">VAT</span>
                      <span className="text-sm font-semibold">
                        ${(totals.subtotal * (Math.max(vatRate, 0) / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                      <span className="text-sm font-semibold">TOTAL</span>
                      <span className="text-sm font-semibold">
                        ${(totals.subtotal * (1 + Math.max(vatRate, 0) / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isFullVariant && (
              <>
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold">Invoice details</h3>
                </div>
                <div className="space-y-4 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <Select
                        value={watch("project_id")}
                        onValueChange={(value) => setValue("project_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select
                        value={watch("client_id")}
                        onValueChange={(value) => setValue("client_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={watch("status")}
                        onValueChange={(value) => setValue("status", value as InvoiceStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input {...register("currency")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea rows={3} {...register("notes")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Terms</Label>
                    <Textarea rows={3} {...register("terms")} />
                  </div>
                </div>
              </>
            )}
          </div>

          {isFullVariant && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line items</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTimesheetDrawerOpen(true)}
                  disabled={!watch("project_id")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  From timesheets
                </Button>
                <Button type="button" size="sm" onClick={handleAddLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden grid-cols-[160px_1fr_120px_120px_40px] gap-3 rounded-lg bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                <div>Type</div>
                <div>Description</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Rate</div>
                <div />
              </div>
              <div className="space-y-3">
                {lineItemFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-xl border px-3 py-3 md:grid-cols-[160px_1fr_120px_120px_40px]"
                  >
                    <Select
                      value={watch(`lineItems.${index}.type` as const)}
                      onValueChange={(value) =>
                        setValue(`lineItems.${index}.type`, value as InvoiceLineItemType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Description"
                      {...register(`lineItems.${index}.description` as const, { required: true })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className="text-right"
                      {...register(`lineItems.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className="text-right"
                      {...register(`lineItems.${index}.unit_price` as const, { valueAsNumber: true })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLineItem(index)}
                      disabled={lineItemFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          )}

          {isFullVariant && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payments</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  appendPayment({
                    amount: 0,
                    payment_date: format(new Date(), "yyyy-MM-dd"),
                    method: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add payment
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                paymentFields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-xl border px-3 py-3 md:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`payments.${index}.amount` as const, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input type="date" {...register(`payments.${index}.payment_date` as const)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Method</Label>
                      <Input {...register(`payments.${index}.method` as const)} />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <Input
                        placeholder="Notes"
                        {...register(`payments.${index}.notes` as const)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            </Card>
          )}
        </div>
        {isFullVariant && (() => {
          const vatAmount = totals.subtotal * Math.max(vatRate, 0) / 100
          const totalWithVat = totals.subtotal + vatAmount
          return (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SUBTOTAL</span>
                    <span className="font-semibold">
                      ${totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="vat_rate_right" className="text-muted-foreground">
                      VAT RATE
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="vat_rate_right"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        className="w-20 text-right"
                        value={Number.isFinite(vatRate) ? String(vatRate) : ""}
                        onChange={(e) => {
                          const num = Number(e.target.value)
                          setVatRate(Number.isNaN(num) ? 0 : num)
                        }}
                        aria-label="VAT rate percentage"
                      />
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">VAT</span>
                    <span className="font-semibold">
                      ${vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">
                      ${totalWithVat.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
      {isFullVariant && (
        <InvoiceTimesheetDrawer
          open={timesheetDrawerOpen}
          onOpenChange={setTimesheetDrawerOpen}
          projectId={watch("project_id")}
          userId={userId}
          onImport={handleImportTimesheets}
        />
      )}
    </form>
  )
}

 