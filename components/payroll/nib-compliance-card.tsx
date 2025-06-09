import { Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface NibComplianceProps {
  totalNibContributions: number
  payPeriod: string
  employeeCount: number
}

export function NibComplianceCard({ totalNibContributions, payPeriod }: NibComplianceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // NIB compliance checks
  const complianceItems = [
    {
      label: "Employee Contributions (4%)",
      value: formatCurrency(totalNibContributions),
      status: "compliant" as const,
      icon: CheckCircle,
    },
    {
      label: "Employer Contributions (5.9%)",
      value: formatCurrency(totalNibContributions * 1.475), // 5.9% vs 4%
      status: "pending" as const,
      icon: AlertCircle,
    },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-[var(--info)]" />
          NIB Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Pay Period</span>
          <Badge variant="outline">{payPeriod}</Badge>
        </div>

        <div className="space-y-3">
          {complianceItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon
                  className={`h-4 w-4 ${item.status === "compliant" ? "text-[var(--primary)]" : "text-[var(--warning)]"}`}
                />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="font-sans text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total NIB Remittance</span>
            <span className="font-sans font-bold text-[var(--info)]">
              {formatCurrency(totalNibContributions * 2.475)} {/* Employee + Employer */}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Due by 15th of following month</p>
        </div>
      </CardContent>
    </Card>
  )
}
