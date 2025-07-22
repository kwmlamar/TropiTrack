import DashboardLayout from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PayrollSettingsForm } from "@/components/settings/payroll/payroll-settings-form"
import { PaymentScheduleForm } from "@/components/settings/payroll/payment-schedule-form"
import { DeductionRulesForm } from "@/components/settings/payroll/deduction-rules-form"

export default function PayrollSettingsPage() {
  return (
    <DashboardLayout title="Payroll Settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Settings</h2>
          <p className="text-muted-foreground">
            Configure your payroll settings, payment schedules, and deduction rules
          </p>
        </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Payroll Settings</CardTitle>
              <CardDescription>
                Configure default pay period type, overtime rates, and NIB deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
              <CardDescription>
                Set up your payment schedule including pay periods and pay days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentScheduleForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>
                Manage payroll deductions and contribution rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeductionRulesForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
} 