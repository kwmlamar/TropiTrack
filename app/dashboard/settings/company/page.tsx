"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building2, 
  DollarSign, 
  FileText, 
  Settings,
  Globe,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Save
} from "lucide-react"
import { CompanyInformationForm } from "@/components/settings/company-information-form"
import { PayrollSettingsForm } from "@/components/settings/payroll/payroll-settings-form"
import { useUser } from "@/lib/hooks/use-user"
import { getCurrentUserCompany } from "@/lib/data/companies-client"
import { getWorkers } from "@/lib/data/workers"
import { getProjects } from "@/lib/data/projects"
import { getPayrolls } from "@/lib/data/payroll"
import type { Company } from "@/lib/data/companies-client"

export default function CompanySettingsPage() {
  const { user, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState("general")
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeWorkers: 0,
    activeProjects: 0,
    monthlyPayroll: 0,
    complianceScore: 98
  })

  // Mock timesheet settings data
  const [timesheetSettings, setTimesheetSettings] = useState({
    workDayStart: "07:00",
    workDayEnd: "16:00",
    breakTime: "60",
    overtimeThreshold: "40",
    roundingMethod: "nearest_15",
    autoClockout: true,
    requireApproval: true,
    allowOvertime: true
  })

  // Load company data and statistics
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!user?.company?.id) return
      
      setLoading(true)
      try {
        // Load company details
        const companyData = await getCurrentUserCompany()
        setCompany(companyData)

        // Load statistics in parallel
        const [workersResponse, projectsResponse, payrollResponse] = await Promise.all([
          getWorkers(user.company.id, { is_active: true }),
          getProjects(user.company.id, { is_active: true, status: "in_progress" }),
          getPayrolls({ 
            date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            date_to: new Date().toISOString().split('T')[0]
          })
        ])

        // Calculate statistics
        const activeWorkers = workersResponse.success ? workersResponse.data?.length || 0 : 0
        const activeProjects = projectsResponse.success ? projectsResponse.data?.length || 0 : 0
        const monthlyPayroll = payrollResponse.success 
          ? payrollResponse.data?.reduce((sum, payroll) => sum + (payroll.gross_pay || 0), 0) || 0
          : 0

        setStats({
          activeWorkers,
          activeProjects,
          monthlyPayroll,
          complianceScore: 98 // This could be calculated based on actual compliance data
        })
      } catch (error) {
        console.error("Error loading company data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()
  }, [user?.company?.id])

  const tabs = [
    { id: "general", label: "General", icon: Building2 },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "timesheets", label: "Timesheets", icon: Clock },
    { id: "compliance", label: "Compliance", icon: Shield },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleTimesheetSettingsSave = async () => {
    // TODO: Implement save functionality
    console.log("Saving timesheet settings:", timesheetSettings)
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load company information. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-sm">Company Name</span>
                <span className="text-sm font-medium text-right break-words max-w-[60%]">{company.name}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm">Industry</span>
                <span className="text-sm text-gray-500 text-right break-words max-w-[60%]">{company.industry || 'Not set'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm">Email</span>
                <span className="text-sm text-gray-500 text-right break-all max-w-[60%]">{company.email}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm">Phone</span>
                <span className="text-sm text-gray-500 text-right break-all max-w-[60%]">{company.phone || 'Not set'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm">Location</span>
                <span className="text-sm text-gray-500 text-right break-words max-w-[60%]">
                  {company.city && company.state 
                    ? `${company.city}, ${company.state}` 
                    : company.address || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Founded</span>
                <span className="text-sm text-gray-500">
                  {company.created_at ? formatDate(company.created_at) : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Workers</span>
                <span className="text-sm font-medium">{stats.activeWorkers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <span className="text-sm font-medium">{stats.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month Payroll</span>
                <span className="text-sm font-medium">{formatCurrency(stats.monthlyPayroll)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance Score</span>
                <Badge variant="default">{stats.complianceScore}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <CompanyInformationForm />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Additional business details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Address</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {company.address || 'Not set'}
                        {company.city && company.state && (
                          <span>, {company.city}, {company.state}</span>
                        )}
                        {company.zip_code && <span> {company.zip_code}</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-4 w-4" />
                        {company.phone || 'Not set'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        {company.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="h-4 w-4" />
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax ID</label>
                      <div className="text-sm text-gray-500">
                        {company.tax_id || 'Not set'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Number</label>
                      <div className="text-sm text-gray-500">
                        {company.business_number || 'Not set'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Company Details
                  </CardTitle>
                  <CardDescription>
                    Additional company information and description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <div className="text-sm text-gray-500">
                      {company.description || 'No description provided'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Updated</label>
                    <div className="text-sm text-gray-500">
                      {company.updated_at ? formatDate(company.updated_at) : 'Unknown'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === "payroll" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Settings
                  </CardTitle>
                  <CardDescription>
                    Configure payroll settings and defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PayrollSettingsForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Payment Schedule
                  </CardTitle>
                  <CardDescription>
                    Configure payment schedules and pay periods. Currently supports weekly payroll only.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Weekly Payroll</p>
                        <p className="text-sm text-muted-foreground">Pay workers every week</p>
                      </div>
                      <Badge variant="default">Current</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                      <div>
                        <p className="font-medium">Bi-Weekly Payroll</p>
                        <p className="text-sm text-muted-foreground">Pay workers every two weeks</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                      <div>
                        <p className="font-medium">Monthly Payroll</p>
                        <p className="text-sm text-muted-foreground">Pay workers once per month</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Additional payment schedules will be available in future updates based on user feedback and demand.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timesheets Settings */}
          {activeTab === "timesheets" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Work Schedule Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure default work hours and schedule settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="workDayStart">Work Day Start Time</Label>
                        <Input
                          id="workDayStart"
                          type="time"
                          value={timesheetSettings.workDayStart}
                          onChange={(e) => setTimesheetSettings({
                            ...timesheetSettings,
                            workDayStart: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workDayEnd">Work Day End Time</Label>
                        <Input
                          id="workDayEnd"
                          type="time"
                          value={timesheetSettings.workDayEnd}
                          onChange={(e) => setTimesheetSettings({
                            ...timesheetSettings,
                            workDayEnd: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="breakTime">Break Time (minutes)</Label>
                        <Input
                          id="breakTime"
                          type="number"
                          value={timesheetSettings.breakTime}
                          onChange={(e) => setTimesheetSettings({
                            ...timesheetSettings,
                            breakTime: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Time Tracking Settings
                  </CardTitle>
                  <CardDescription>
                    Configure time tracking behavior and rules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="overtimeThreshold">Overtime Threshold (hours/week)</Label>
                        <Input
                          id="overtimeThreshold"
                          type="number"
                          value={timesheetSettings.overtimeThreshold}
                          onChange={(e) => setTimesheetSettings({
                            ...timesheetSettings,
                            overtimeThreshold: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roundingMethod">Time Rounding Method</Label>
                        <Select
                          value={timesheetSettings.roundingMethod}
                          onValueChange={(value) => setTimesheetSettings({
                            ...timesheetSettings,
                            roundingMethod: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nearest_15">Nearest 15 minutes</SelectItem>
                            <SelectItem value="nearest_30">Nearest 30 minutes</SelectItem>
                            <SelectItem value="nearest_hour">Nearest hour</SelectItem>
                            <SelectItem value="no_rounding">No rounding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Automation & Approval Settings
                  </CardTitle>
                  <CardDescription>
                    Configure automatic features and approval requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Clock-out</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically clock out workers at the end of their shift
                        </p>
                      </div>
                      <Switch
                        checked={timesheetSettings.autoClockout}
                        onCheckedChange={(checked) => setTimesheetSettings({
                          ...timesheetSettings,
                          autoClockout: checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Timesheet Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Require supervisor approval for all timesheets
                        </p>
                      </div>
                      <Switch
                        checked={timesheetSettings.requireApproval}
                        onCheckedChange={(checked) => setTimesheetSettings({
                          ...timesheetSettings,
                          requireApproval: checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Overtime</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow workers to clock in overtime hours
                        </p>
                      </div>
                      <Switch
                        checked={timesheetSettings.allowOvertime}
                        onCheckedChange={(checked) => setTimesheetSettings({
                          ...timesheetSettings,
                          allowOvertime: checked
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleTimesheetSettingsSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Timesheet Settings
                </Button>
              </div>
            </div>
          )}

          {/* Compliance Settings */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Overview
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage compliance requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.complianceScore}%</div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-500">Requirements Met</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">2</div>
                      <div className="text-sm text-gray-500">Pending Review</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">NIB Contributions</p>
                          <p className="text-sm text-gray-500">Employee: 4.65%, Employer: 6.65%</p>
                        </div>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">VAT Registration</p>
                          <p className="text-sm text-gray-500">VAT #: 123456789</p>
                        </div>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Bahamas Labor Law</p>
                          <p className="text-sm text-gray-500">Employment Standards Act</p>
                        </div>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">VAT Filing</p>
                          <p className="text-sm text-gray-500">Due: March 31, 2024</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Business License Renewal</p>
                          <p className="text-sm text-gray-500">Due: April 15, 2024</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>
                    Generate and download compliance reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    NIB Contributions Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    VAT Filing Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Business License Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Employment Standards Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 