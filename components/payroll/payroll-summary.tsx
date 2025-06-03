import { Users, Clock, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PayrollSummaryData {
  totalEmployees: number
  totalHours: number
  totalOvertimeHours: number
  totalGrossPay: number
  totalNibDeductions: number
  totalOtherDeductions: number
  totalDeductions: number
  totalNetPay: number
}

interface PayrollSummaryProps {
  data: PayrollSummaryData
}

export function PayrollSummary({ data }: PayrollSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const summaryItems = [
    {
      title: "Total Employees",
      value: data.totalEmployees.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Hours",
      value: `${data.totalHours}h`,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Overtime Hours",
      value: `${data.totalOvertimeHours}h`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Pay</span>
              <span className="font-mono font-medium">{formatCurrency(data.totalGrossPay)}</span>
            </div>
            <div className="border-l-2 border-blue-200 pl-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">NIB Contributions</span>
                <span className="font-mono text-blue-600">-{formatCurrency(data.totalNibDeductions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Other Deductions</span>
                <span className="font-mono text-red-600">-{formatCurrency(data.totalOtherDeductions)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Deductions</span>
              <span className="font-mono text-red-600">-{formatCurrency(data.totalDeductions)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Pay</span>
                <span className="font-mono font-bold text-green-600 text-lg">{formatCurrency(data.totalNetPay)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
