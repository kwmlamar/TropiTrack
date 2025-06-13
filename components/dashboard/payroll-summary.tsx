import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign } from "lucide-react"

export function PayrollSummary() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Payroll Summary</CardTitle>
        <CardDescription>Current pay period (Dec 4-10)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Pay</span>
            <span className="font-medium">$12,480.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">NIB Contributions</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">$499.20</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Other Deductions</span>
            <span className="font-medium text-red-600 dark:text-red-400">$1,248.00</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-center justify-between font-medium">
              <span>Net Pay</span>
              <span className="text-green-600 dark:text-green-400">$10,732.80</span>
            </div>
          </div>
        </div>
        <Button className="w-full gap-2">
          <DollarSign className="h-4 w-4" />
          <span>Process Payroll</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
