import PDFDocument from "pdfkit"
import type { Invoice } from "@/lib/types/invoice"
import { format } from "date-fns"

function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount || 0))
}

export async function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" })
    const buffers: Buffer[] = []

    doc.on("data", (chunk) => buffers.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(buffers)))
    doc.on("error", reject)

    const companyName = invoice.project?.name || "Project"
    const clientName = invoice.client?.name || "Client"

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Invoice", { align: "left" })
      .moveDown(0.5)

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice #: ${invoice.invoice_number}`, { continued: true })
      .text(`Status: ${invoice.status.toUpperCase()}`, { align: "right" })

    doc
      .text(`Issue Date: ${format(new Date(invoice.issue_date), "PPP")}`)
      .text(`Due Date: ${format(new Date(invoice.due_date), "PPP")}`)
      .moveDown()

    doc
      .font("Helvetica-Bold")
      .text("Bill To")
      .font("Helvetica")
      .text(clientName)

    if (invoice.client?.company) {
      doc.text(invoice.client.company)
    }
    if (invoice.client?.email) {
      doc.text(invoice.client.email)
    }
    if (invoice.client?.phone) {
      doc.text(invoice.client.phone)
    }

    doc.moveDown()
    doc
      .font("Helvetica-Bold")
      .text("Project")
      .font("Helvetica")
      .text(companyName)
      .moveDown()

    // Table headers
    const tableTop = doc.y
    const columnWidths = [220, 80, 100, 100]

    doc
      .font("Helvetica-Bold")
      .text("Description", 48, tableTop, { width: columnWidths[0] })
      .text("Qty", 48 + columnWidths[0], tableTop, {
        width: columnWidths[1],
        align: "right",
      })
      .text("Unit Price", 48 + columnWidths[0] + columnWidths[1], tableTop, {
        width: columnWidths[2],
        align: "right",
      })
      .text("Amount", 48 + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, {
        width: columnWidths[3],
        align: "right",
      })

    doc.moveDown(0.5).font("Helvetica").strokeColor("#e5e7eb").lineWidth(1)
    doc
      .moveTo(48, doc.y)
      .lineTo(548, doc.y)
      .stroke()
      .moveDown(0.5)

    const items = invoice.line_items || []
    items.forEach((item) => {
      const y = doc.y
      doc
        .text(item.description, 48, y, { width: columnWidths[0] })
        .text(item.quantity?.toFixed(2) ?? "0.00", 48 + columnWidths[0], y, {
          width: columnWidths[1],
          align: "right",
        })
        .text(
          formatCurrency(item.unit_price),
          48 + columnWidths[0] + columnWidths[1],
          y,
          {
            width: columnWidths[2],
            align: "right",
          }
        )
        .text(
          formatCurrency(item.total),
          48 + columnWidths[0] + columnWidths[1] + columnWidths[2],
          y,
          {
            width: columnWidths[3],
            align: "right",
          }
        )
      doc.moveDown()
    })

    doc.moveDown(0.5).strokeColor("#e5e7eb").lineWidth(1)
    doc
      .moveTo(48, doc.y)
      .lineTo(548, doc.y)
      .stroke()
      .moveDown()

    // Totals
    const summaryX = 48 + columnWidths[0] + columnWidths[1]
    doc.font("Helvetica").text("Subtotal:", summaryX, doc.y, {
      width: columnWidths[2],
      align: "right",
    })
    doc.font("Helvetica-Bold").text(formatCurrency(invoice.subtotal), summaryX + columnWidths[2], doc.y, {
      width: columnWidths[3],
      align: "right",
    })

    doc.moveDown(0.3).font("Helvetica").text("Paid to Date:", summaryX, doc.y, {
      width: columnWidths[2],
      align: "right",
    })
    doc
      .font("Helvetica-Bold")
      .text(formatCurrency(invoice.amount_paid), summaryX + columnWidths[2], doc.y, {
        width: columnWidths[3],
        align: "right",
      })

    doc.moveDown(0.3).font("Helvetica-Bold").text("Balance Due:", summaryX, doc.y, {
      width: columnWidths[2],
      align: "right",
    })
    doc
      .fontSize(14)
      .text(
        formatCurrency(invoice.total_amount - invoice.amount_paid),
        summaryX + columnWidths[2],
        doc.y - 4,
        {
          width: columnWidths[3],
          align: "right",
        }
      )
      .fontSize(10)

    if (invoice.notes) {
      doc.moveDown(1.5)
      doc.font("Helvetica-Bold").text("Notes")
      doc.font("Helvetica").text(invoice.notes)
    }

    if (invoice.terms) {
      doc.moveDown()
      doc.font("Helvetica-Bold").text("Terms")
      doc.font("Helvetica").text(invoice.terms)
    }

    doc.end()
  })
}



