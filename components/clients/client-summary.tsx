"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Receipt, Edit3, CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface ClientSummaryProps {
  clientId: string
  companyId: string
}

interface SummaryItem {
  label: string
  icon: React.ReactNode
  accepted: number
  pending: number
  overdue: number
  total: number
}

export function ClientSummary({ }: ClientSummaryProps) {
  // TODO: Replace with actual data fetching when tables are created
  // For now, showing empty state
  const summaryData: SummaryItem[] = [
    {
      label: "Estimates",
      icon: <FileText className="h-5 w-5" />,
      accepted: 0,
      pending: 0,
      overdue: 0,
      total: 0
    },
    {
      label: "Change Orders",
      icon: <Edit3 className="h-5 w-5" />,
      accepted: 0,
      pending: 0,
      overdue: 0,
      total: 0
    },
    {
      label: "Invoices",
      icon: <Receipt className="h-5 w-5" />,
      accepted: 0,
      pending: 0,
      overdue: 0,
      total: 0
    }
  ]

  const getStatusBadge = (count: number, type: 'accepted' | 'pending' | 'overdue') => {
    if (count === 0) return null

    const variants = {
      accepted: "default" as const,
      pending: "secondary" as const,
      overdue: "destructive" as const
    }

    const icons = {
      accepted: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      overdue: <AlertTriangle className="h-3 w-3" />
    }

    const colors = {
      accepted: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      overdue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
    }

    return (
      <Badge 
        variant={variants[type]}
        className={`${colors[type]} flex items-center gap-1 px-2 py-1 text-xs font-medium`}
      >
        {icons[type]}
        {count}
      </Badge>
    )
  }

  return (
    <Card className="border-border/50">
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {summaryData.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <div className="bg-sidebar-accent/20 px-2 py-1 rounded text-sm font-medium text-sidebar-accent-foreground">
                  {item.total}
                </div>
              </div>
              
              {/* Status Counts */}
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(item.accepted, 'accepted')}
                {getStatusBadge(item.pending, 'pending')}
                {getStatusBadge(item.overdue, 'overdue')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
