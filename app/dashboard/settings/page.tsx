"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Users, Briefcase, ClipboardList, DollarSign, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PayrollSettingsForm } from "@/components/settings/payroll/payroll-settings-form"
import { PaymentScheduleForm } from "@/components/settings/payroll/payment-schedule-form"
import { DeductionRulesForm } from "@/components/settings/payroll/deduction-rules-form"
import { CompanyInformationForm } from "@/components/settings/company-information-form"
import { PreferencesForm } from "@/components/settings/preferences-form"

const settingsTabs = [
  {
    id: "general",
    label: "General",
    icon: Settings,
  },
  {
    id: "workers",
    label: "Workers",
    icon: Users,
  },
  {
    id: "clients",
    label: "Clients",
    icon: Building2,
  },
  {
    id: "projects",
    label: "Projects",
    icon: Briefcase,
  },
  {
    id: "timesheets",
    label: "Timesheets",
    icon: ClipboardList,
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: DollarSign,
  },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && settingsTabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-background h-auto p-1 flex flex-wrap gap-1">
          {settingsTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2",
                activeTab === tab.id ? "bg-primary " : ""
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <CompanyInformationForm />
          <PreferencesForm />

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your application preferences and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Preferences Form */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker Settings</CardTitle>
              <CardDescription>
                Configure worker-related settings and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Worker Settings Form */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departments & Positions</CardTitle>
              <CardDescription>
                Manage departments and job positions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Departments and Positions Management */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Settings</CardTitle>
              <CardDescription>
                Configure client-related settings and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Client Settings Form */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Configure project-related settings and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Project Settings Form */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Categories</CardTitle>
              <CardDescription>
                Manage project categories and types.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Project Categories Management */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Settings</CardTitle>
              <CardDescription>
                Configure timesheet-related settings and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timesheet Settings Form */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Configure timesheet approval workflow and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Approval Workflow Settings */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
              <CardDescription>
                Configure payroll-related settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollSettingsForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
              <CardDescription>
                Configure payment schedules and pay periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentScheduleForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>
                Configure standard deductions and calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeductionRulesForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
