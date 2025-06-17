import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Plus, UserPlus, DollarSign } from "lucide-react"

export function QuickActions() {
  // Quick action buttons
  const actions = [
    {
      label: "Add Timesheet",
      icon: Clock,
      href: "/timesheets/new",
    },
    {
      label: "Add Worker",
      icon: UserPlus,
      href: "/workers/new",
    },
    {
      label: "New Report",
      icon: FileText,
      href: "/reports/new",
    },
    {
      label: "Process Payroll",
      icon: DollarSign,
      href: "/payroll/process",
    },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button key={index} variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <a href={action.href}>
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </a>
            </Button>
          ))}
        </div>
        <Button variant="ghost" className="mt-4 w-full justify-start text-muted-foreground">
          <Plus className="mr-2 h-4 w-4" />
          <span>More Actions</span>
        </Button>
      </CardContent>
    </Card>
  )
}
