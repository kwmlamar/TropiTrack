import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import { NibWorkersList } from "@/components/settings/nib-workers-list"

export default function NibSettingsPage() {
  return (
    <div className="space-y-6 mt-4">
      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            NIB Deduction Settings
          </CardTitle>
          <CardDescription>
            Manage which workers have National Insurance Board (NIB) deductions applied to their payroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NibWorkersList />
        </CardContent>
      </Card>
    </div>
  )
}

