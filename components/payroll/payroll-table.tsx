"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PayrollRecord {
  id: string
  workerId: string
  workerName: string
  totalHours: number
  overtimeHours: number
  hourlyRate: number
  grossPay: number
  nibDeduction: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  status: 'pending' | 'approved' | 'rejected'
}

interface PayrollTableProps {
  data: PayrollRecord[]
}

export function PayrollTable({ data }: PayrollTableProps) {
  const [sortField, setSortField] = useState<keyof PayrollRecord>("workerId")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSort = (field: keyof PayrollRecord) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
    return 0
  })

  // Define columns for grid: Worker, Total Hours, Overtime, Hourly Rate, Gross Pay, NIB Deduction, Other Deductions, Net Pay, Actions
  const columns = [
    { label: "Worker", sortable: true, field: "workerId" },
    { label: "Total Hours", sortable: true, field: "totalHours" },
    { label: "Overtime", sortable: true, field: "overtimeHours" },
    { label: "Hourly Rate", sortable: true, field: "hourlyRate" },
    { label: "Gross Pay", sortable: true, field: "grossPay" },
    { label: "NIB Deduction", sortable: true, field: "nibDeduction" },
    { label: "Other Deductions", sortable: true, field: "otherDeductions" },
    { label: "Net Pay", sortable: true, field: "netPay" },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30 min-w-[1000px]">
            {columns.map((col) => (
              <div
                key={col.label}
                className={`text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide ${col.sortable ? "cursor-pointer hover:text-foreground" : ""}`}
                onClick={col.sortable ? () => handleSort(col.field as keyof PayrollRecord) : undefined}
              >
                {col.label}
                {col.sortable && sortField === col.field && (
                  <span className="ml-1">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </div>
            ))}
            <div /> {/* Empty column for actions */}
          </div>
          {/* Data Rows */}
          <div className="divide-y divide-border/50 min-w-[1000px]">
            {sortedData.map((record) => (
              <div
                key={record.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group"
              >
                {/* Worker cell: avatar, name */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {record.workerName
                        ? record.workerName.split(" ").map((n) => n[0]).join("").toUpperCase()
                        : record.workerId.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {record.workerName || record.workerId}
                    </p>
                  </div>
                </div>
                {/* Total Hours */}
                <div className="text-left">
                  <span className="font-sans">{record.totalHours}</span>
                </div>
                {/* Overtime */}
                <div className="text-left">
                  <span className="font-sans text-orange-600">{record.overtimeHours}</span>
                </div>
                {/* Hourly Rate */}
                <div className="text-left">
                  <span className="font-sans">{formatCurrency(record.hourlyRate)}</span>
                </div>
                {/* Gross Pay */}
                <div className="text-left">
                  <span className="font-sans font-medium">{formatCurrency(record.grossPay)}</span>
                </div>
                {/* NIB Deduction */}
                <div className="text-left">
                  <span className="font-sans text-[var(--info)]">-{formatCurrency(record.nibDeduction)}</span>
                </div>
                {/* Other Deductions */}
                <div className="text-left">
                  <span className="font-sans text-[var(--destructive)]">-{formatCurrency(record.otherDeductions)}</span>
                </div>
                {/* Net Pay */}
                <div className="text-left">
                  <span className="font-sans font-bold text-[var(--primary)]">{formatCurrency(record.netPay)}</span>
                </div>
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="text-sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Payslip
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-sm">Edit Record</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
