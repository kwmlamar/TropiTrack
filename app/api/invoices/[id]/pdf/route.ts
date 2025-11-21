import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateInvoicePdf } from "@/lib/invoices/pdf"

const invoiceSelect = `
  *,
  project:projects(id, name),
  client:clients(id, name, company, email, phone),
  line_items:invoice_line_items(*),
  payments:invoice_payments(*)
`

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 })
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(invoiceSelect)
      .eq("company_id", profile.company_id)
      .eq("id", id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const pdfBuffer = await generateInvoicePdf(invoice)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



