"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Receipt, AlertCircle } from "lucide-react"
import { FinancialData } from "./types"

interface FinancialSnapshotProps {
  financials: FinancialData
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BS", {
    style: "currency",
    currency: "BSD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function FinancialSnapshot({ financials }: FinancialSnapshotProps) {
  const laborPercentage = financials.estimatedLabor > 0
    ? (financials.actualLabor / financials.estimatedLabor) * 100
    : 0

  const getLaborColor = () => {
    if (laborPercentage <= 70) return "bg-green-500"
    if (laborPercentage <= 90) return "bg-amber-500"
    return "bg-red-500"
  }

  const getOutstandingColor = () => {
    if (financials.outstandingBalance === 0) return "text-green-600"
    if (financials.unpaidInvoiceCount <= 1) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Estimated Labor Cost */}
      <Card className="bg-[#E8EDF5] dark:bg-[#1e293b] border-0 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Est. Labor Cost
            </span>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <DollarSign className="h-4 w-4 text-[#2596be]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(financials.estimatedLabor)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Budget allocated
          </p>
        </CardContent>
      </Card>

      {/* Actual Labor Cost */}
      <Card className="bg-[#E8EDF5] dark:bg-[#1e293b] border-0 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Actual Labor
            </span>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <TrendingUp className="h-4 w-4 text-[#2596be]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(financials.actualLabor)}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                {laborPercentage.toFixed(0)}% of budget
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getLaborColor()}`}
                style={{ width: `${Math.min(laborPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Invoiced */}
      <Card className="bg-[#E8EDF5] dark:bg-[#1e293b] border-0 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Invoiced
            </span>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Receipt className="h-4 w-4 text-[#2596be]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(financials.invoicedAmount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {financials.invoiceCount} invoice{financials.invoiceCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Outstanding Balance */}
      <Card className="bg-[#E8EDF5] dark:bg-[#1e293b] border-0 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Outstanding
            </span>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <AlertCircle className={`h-4 w-4 ${getOutstandingColor()}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${getOutstandingColor()}`}>
            {formatCurrency(financials.outstandingBalance)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {financials.unpaidInvoiceCount} unpaid invoice{financials.unpaidInvoiceCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
