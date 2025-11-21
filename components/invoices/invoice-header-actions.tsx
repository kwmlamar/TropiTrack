"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface InvoiceHeaderActionsProps {
  formId?: string
  invoiceId?: string
}

export function InvoiceHeaderActions({ formId = "invoice-form", invoiceId }: InvoiceHeaderActionsProps) {
  return (
    <div className="flex gap-2">
      <Button type="submit" form={formId} variant="outline">
        Save
      </Button>
      {invoiceId ? (
        <Button asChild>
          <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
      ) : (
        <Button disabled>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      )}
    </div>
  )
}

