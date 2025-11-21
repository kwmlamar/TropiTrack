import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateInvoicePdf } from "@/lib/invoices/pdf"
import { EmailService } from "@/lib/email/service"

const invoiceSelect = `
  *,
  project:projects(id, name),
  client:clients(id, name, company, email, phone),
  line_items:invoice_line_items(*),
  payments:invoice_payments(*)
`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const { invoiceId, to, message, attachPdf = true, subject } = payload || {}

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 })
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
      .eq("id", invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const recipient = to || invoice.client?.email

    if (!recipient) {
      return NextResponse.json(
        { error: "Missing recipient email" },
        { status: 400 }
      )
    }

    const pdfBuffer = attachPdf ? await generateInvoicePdf(invoice) : undefined
    const sendResult = await EmailService.sendInvoiceEmail({
      invoice,
      to: recipient,
      message,
      pdfBuffer,
      subject,
    })

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Failed to send invoice" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



