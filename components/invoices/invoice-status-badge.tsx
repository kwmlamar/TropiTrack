import { Badge } from "@/components/ui/badge"
import type { InvoiceStatus } from "@/lib/types/invoice"
import { cn } from "@/lib/utils"

const styles: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-blue-100 text-blue-600 border-blue-200",
  paid: "bg-emerald-100 text-emerald-600 border-emerald-200",
  overdue: "bg-red-100 text-red-600 border-red-200",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize px-2 py-1 text-xs font-medium", styles[status])}>
      {status}
    </Badge>
  )
}

