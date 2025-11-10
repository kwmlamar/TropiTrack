import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Building2 } from "lucide-react"
import { NibWorkersList } from "@/components/settings/nib-workers-list"
import { NibCompanySettings } from "@/components/settings/nib-company-settings"

export default function NibSettingsPage() {
  return (
    <div className="space-y-6 mt-4">
      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company NIB Settings
          </CardTitle>
          <CardDescription>
            Configure company-wide NIB (National Insurance Board) deduction settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NibCompanySettings />
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-none dark:bg-[#181818] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Worker NIB Exemptions
          </CardTitle>
          <CardDescription>
            Manage which workers are exempt from NIB deductions (e.g., contractors, part-time workers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NibWorkersList />
        </CardContent>
      </Card>
    </div>
  )
}

