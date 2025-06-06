"use client"

import { Suspense, useState, useEffect } from "react"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { PayrollFilters } from "@/components/payroll/payroll-filters"
import { PayrollTable } from "@/components/payroll/payroll-table"
import { PayrollSummary } from "@/components/payroll/payroll-summary"
import { PayrollActions } from "@/components/payroll/payroll-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NibComplianceCard } from "@/components/payroll/nib-compliance-card"

// Mock data for demonstration
const mockPayrollData = [
  {
    id: "1",
    workerId: "w1",
    workerName: "Marcus Johnson",
    totalHours: 45,
    overtimeHours: 5,
    hourlyRate: 18.5,
    grossPay: 925.0,
    nibDeduction: 37.0, // 4% of gross pay
    otherDeductions: 148.0, // Income tax, etc.
    totalDeductions: 185.0,
    netPay: 740.0,
    position: "Carpenter",
    department: "Construction",
  },
  {
    id: "2",
    workerId: "w2",
    workerName: "Sarah Williams",
    totalHours: 40,
    overtimeHours: 0,
    hourlyRate: 22.0,
    grossPay: 880.0,
    nibDeduction: 35.2,
    otherDeductions: 140.8,
    totalDeductions: 176.0,
    netPay: 704.0,
    position: "Site Supervisor",
    department: "Management",
  },
  {
    id: "3",
    workerId: "w3",
    workerName: "David Thompson",
    totalHours: 42,
    overtimeHours: 2,
    hourlyRate: 16.75,
    grossPay: 737.5,
    nibDeduction: 29.5,
    otherDeductions: 118.0,
    totalDeductions: 147.5,
    netPay: 590.0,
    position: "Laborer",
    department: "Construction",
  },
  {
    id: "4",
    workerId: "w4",
    workerName: "Lisa Rodriguez",
    totalHours: 38,
    overtimeHours: 0,
    hourlyRate: 25.0,
    grossPay: 950.0,
    nibDeduction: 38.0,
    otherDeductions: 152.0,
    totalDeductions: 190.0,
    netPay: 760.0,
    position: "Project Manager",
    department: "Management",
  },
  {
    id: "5",
    workerId: "w5",
    workerName: "James Mitchell",
    totalHours: 44,
    overtimeHours: 4,
    hourlyRate: 19.25,
    grossPay: 923.0,
    nibDeduction: 36.92,
    otherDeductions: 147.68,
    totalDeductions: 184.6,
    netPay: 738.4,
    position: "Electrician",
    department: "Trades",
  },
]

export default function PayrollPage() {
  const totalGrossPay = mockPayrollData.reduce((sum, record) => sum + record.grossPay, 0)
  const totalDeductions = mockPayrollData.reduce((sum, record) => sum + record.deductions, 0)
  const totalNetPay = mockPayrollData.reduce((sum, record) => sum + record.netPay, 0)
  const totalHours = mockPayrollData.reduce((sum, record) => sum + record.totalHours, 0)
  const totalOvertimeHours = mockPayrollData.reduce((sum, record) => sum + record.overtimeHours, 0)

  const totalNibDeductions = mockPayrollData.reduce((sum, record) => sum + record.nibDeduction, 0)
  const totalOtherDeductions = mockPayrollData.reduce((sum, record) => sum + record.otherDeductions, 0)

  const summaryData = {
    totalEmployees: mockPayrollData.length,
    totalHours,
    totalOvertimeHours,
    totalGrossPay,
    totalNibDeductions,
    totalOtherDeductions,
    totalDeductions,
    totalNetPay,
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <PayrollHeader />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <PayrollFilters />
            </CardContent>
          </Card>

          <Suspense fallback={<PayrollTableSkeleton />}>
            <PayrollTable data={mockPayrollData} />
          </Suspense>
        </div>

        <div className="space-y-6">
          <PayrollSummary data={summaryData} />
          <NibComplianceCard
            totalNibContributions={totalNibDeductions}
            employeeCount={mockPayrollData.length}
            payPeriod="Weekly: Dec 4-10, 2023"
          />
          <PayrollActions />
        </div>
      </div>
    </div>
  )
}

function PayrollTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
