import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleCheck, CircleX } from "lucide-react"

interface NibComplianceProps {
  totalNibContributions: number
  nibRate?: number
}

export function NibComplianceCard({
  totalNibContributions,
  nibRate,
}: NibComplianceProps) {
  const EMPLOYER_NIB_RATE = 6.65 // 6.65%

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate employer contribution based on employee contribution
  const employerContribution = nibRate
    ? (totalNibContributions / nibRate) * EMPLOYER_NIB_RATE
    : 0

  const totalContributions = totalNibContributions + employerContribution
  const isCompliant = totalNibContributions > 0

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {isCompliant ? (
            <CircleCheck className="h-5 w-5 text-[var(--primary)]" />
          ) : (
            <CircleX className="h-5 w-5 text-[var(--destructive)]" />
          )}
          NIB Compliance
        </CardTitle>
        <CardDescription className="sr-only">
          {nibRate ? `Employee NIB Rate: ${nibRate}%` : "NIB rate not configured"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employee Rate</span>
            <span className="font-medium">{nibRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employee Contributions</span>
            <span className="font-medium">{formatCurrency(totalNibContributions)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employer Rate</span>
            <span className="font-medium">{EMPLOYER_NIB_RATE}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employer Contributions</span>
            <span className="font-medium">{formatCurrency(employerContribution)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total NIB Remittance</span>
              <span className="font-sans font-bold text-[var(--primary)] text-lg">
                {formatCurrency(totalContributions)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Due by 15th of following month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

