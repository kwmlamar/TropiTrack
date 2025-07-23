import { Users, Clock, TrendingUp } from "lucide-react"
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
      color: "text-[var(--info)]",
      bgColor: "bg-[var(--info)]/10",
    },
    {
      title: "Total Hours",
      value: `${data.totalHours}h`,
      icon: Clock,
      color: "text-[var(--primary)]",
      bgColor: "bg-[var(--primary)]/10",
    },
    {
      title: "Overtime Hours",
      value: `${data.totalOvertimeHours}h`,
      icon: TrendingUp,
      color: "text-[var(--warning)]",
      bgColor: "bg-[var(--warning)]/10",
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
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
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Gross Pay</span>
              <span className="font-sans font-medium">{formatCurrency(data.totalGrossPay)}</span>
            </div>
            <div className="border-l-2 border-blue-200 pl-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">NIB Contributions</span>
                <span className="font-sans text-[var(--info)]">-{formatCurrency(data.totalNibDeductions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Other Deductions</span>
                <span className="font-sans text-[var(--destructive)]">-{formatCurrency(data.totalOtherDeductions)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Deductions</span>
              <span className="font-sans text-[var(--destructive)]">-{formatCurrency(data.totalDeductions)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Pay</span>
                <span className="font-sans font-bold text-[var(--primary)] text-lg">{formatCurrency(data.totalNetPay)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
