"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, Download, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PayrollRecord {
  id: string
  workerId: string
  totalHours: number
  overtimeHours: number
  hourlyRate: number
  grossPay: number
  nibDeduction: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  position: string
  department: string
}

interface PayrollTableProps {
  data: PayrollRecord[]
}

export function PayrollTable({ data }: PayrollTableProps) {
  const [sortField, setSortField] = useState<keyof PayrollRecord>("workerName")
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payroll Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("workerName")}>
                  Worker Name
                </TableHead>
                <TableHead>Position</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("totalHours")}
                >
                  Total Hours
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("overtimeHours")}
                >
                  Overtime
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("hourlyRate")}
                >
                  Hourly Rate
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("grossPay")}
                >
                  Gross Pay
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("nibDeduction")}
                >
                  NIB Deduction
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("otherDeductions")}
                >
                  Other Deductions
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort("netPay")}>
                  Net Pay
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{record.workerName}</span>
                      <span className="text-sm text-muted-foreground">ID: {record.workerId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{record.position}</span>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {record.department}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">{record.totalHours}h</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-orange-600">{record.overtimeHours}h</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">{formatCurrency(record.hourlyRate)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-medium">{formatCurrency(record.grossPay)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-blue-600">-{formatCurrency(record.nibDeduction)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-red-600">-{formatCurrency(record.otherDeductions)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-bold text-green-600">{formatCurrency(record.netPay)}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Payslip
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Record</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
